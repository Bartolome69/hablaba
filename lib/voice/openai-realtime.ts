// OpenAI Realtime over WebRTC — the ONLY file in the module that knows about
// WebRTC, OpenAI event names, or SDP. Everything else talks to `VoiceEngine`.
//
// Flow: our server mints a short-lived client secret (the caller says which
// endpoint — each surface has its own instructions built server-side there),
// the browser opens a peer connection with the mic as the outbound track, POSTs
// its SDP offer to OpenAI with that secret, and gets an answer back. Audio then
// flows peer-to-peer; JSON events flow over the `oai-events` data channel.
// The API key never leaves the server.

import type { VoiceEngine, VoiceEngineFactory, VoiceEngineHandlers, VoiceEngineStartOptions } from "./adapter"
import type { VoiceEngineMeta, VoiceSeedContext, VoiceSpeaker, VoiceTurn } from "./types"

const PROVIDER = "openai-realtime"
const CALLS_URL = "https://api.openai.com/v1/realtime/calls"
const DATA_CHANNEL = "oai-events"

// Left as the WebRTC defaults on purpose. With Bluetooth earbuds there is no
// acoustic echo path, but AEC costs nothing there and is essential the moment
// the parent falls back to the phone speaker — and we cannot tell which is in
// use from the web. Noise suppression earns its keep on a street walk either
// way. Shared by start() and resume() so a resumed mic behaves identically.
const MIC_CONSTRAINTS: MediaStreamConstraints = {
  audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
}

interface MintedSession {
  clientSecret: string
  model: string
  voice: string
}

/** Mirrors the subset of Realtime server events we act on. */
interface RealtimeEvent {
  type: string
  item_id?: string
  transcript?: string
  delta?: string
  item?: { id?: string; role?: string }
  error?: { message?: string }
}

class OpenAIRealtimeEngine implements VoiceEngine {
  private pc: RTCPeerConnection | null = null
  private channel: RTCDataChannel | null = null
  private micStream: MediaStream | null = null
  private stopped = false
  private paused = false
  /** Kept so pause/resume can detach and reattach the mic without renegotiating. */
  private micSender: RTCRtpSender | null = null
  private audioElement: HTMLAudioElement | null = null

  /** item_id → turn. Holds partials until they finalise. */
  private turns = new Map<string, VoiceTurn>()
  private nextOrdinal = 0

  constructor(private handlers: VoiceEngineHandlers) {}

  async start({ audioElement, seedContext, sessionEndpoint }: VoiceEngineStartOptions): Promise<void> {
    if (typeof RTCPeerConnection === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      this.handlers.onError({
        kind: "unsupported",
        message: "Tu navegador no puede hacer llamadas de voz. Probá con Safari o Chrome actualizado.",
      })
      return
    }

    this.audioElement = audioElement

    // 1. Mic first: it is the step most likely to fail or be denied, and asking
    //    before we have spent anything keeps the failure cheap.
    //
    // Bluetooth caveat we cannot fix from here: on Android, opening a mic
    // forces the headset onto the hands-free profile (mono, narrowband), so
    // the partner's voice will sound worse through earbuds than music does.
    // That is an OS routing decision, not something a constraint can undo.
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS)
    } catch (err) {
      const denied = err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError")
      this.handlers.onError({
        kind: denied ? "mic-denied" : "mic-unavailable",
        message: denied
          ? "No tenemos permiso para usar el micrófono."
          : "No pudimos abrir el micrófono. Fijate que no lo esté usando otra app.",
        cause: err,
      })
      return
    }
    if (this.stopped) return this.teardown()

    // 2. Ephemeral credential from our own server.
    let session: MintedSession
    try {
      session = await this.mintSession(sessionEndpoint, seedContext)
    } catch (err) {
      this.handlers.onError({
        kind: "token",
        message: "No pudimos empezar la sesión. Probá de nuevo en un momento.",
        cause: err,
      })
      return this.teardown()
    }
    if (this.stopped) return this.teardown()

    // 3. Peer connection.
    try {
      await this.connect(session, audioElement)
    } catch (err) {
      if (this.stopped) return
      this.handlers.onError({
        kind: "network",
        message: "Se cortó la conexión. Fijate que tengas señal y volvé a intentar.",
        cause: err,
      })
      return this.teardown()
    }
  }

  private async mintSession(endpoint: string, seedContext: VoiceSeedContext): Promise<MintedSession> {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(seedContext),
    })
    if (!res.ok) throw new Error(`voice session mint failed: ${res.status}`)
    const data = (await res.json()) as Partial<MintedSession>
    if (!data.clientSecret) throw new Error("voice session mint returned no client secret")
    return { clientSecret: data.clientSecret, model: data.model ?? "", voice: data.voice ?? "" }
  }

  private async connect(session: MintedSession, audioElement: HTMLAudioElement): Promise<void> {
    const pc = new RTCPeerConnection()
    this.pc = pc

    // Partner's voice arrives as a remote track.
    pc.ontrack = (event) => {
      audioElement.srcObject = event.streams[0] ?? null
      // Autoplay can still be refused; the caller primed this element inside
      // the tap handler, so a rejection here is not fatal to the transcript.
      void audioElement.play().catch(() => {})
    }

    pc.onconnectionstatechange = () => {
      if (this.stopped) return
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        this.handlers.onError({
          kind: "network",
          message: "Se perdió la conexión.",
        })
        this.teardown()
        this.handlers.onClose()
      }
    }

    for (const track of this.micStream?.getAudioTracks() ?? []) {
      this.micSender = pc.addTrack(track, this.micStream!)
    }

    const channel = pc.createDataChannel(DATA_CHANNEL)
    this.channel = channel
    channel.onmessage = (event) => this.handleEvent(event.data)
    channel.onopen = () => {
      this.handlers.onOpen({ provider: PROVIDER, model: session.model, voice: session.voice })
    }

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    const answer = await fetch(CALLS_URL, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${session.clientSecret}`,
        "Content-Type": "application/sdp",
      },
    })
    if (!answer.ok) throw new Error(`realtime SDP exchange failed: ${answer.status}`)

    await pc.setRemoteDescription({ type: "answer", sdp: await answer.text() })
  }

  // --- event → turn translation ---

  private handleEvent(raw: unknown) {
    if (typeof raw !== "string") return
    let event: RealtimeEvent
    try {
      event = JSON.parse(raw) as RealtimeEvent
    } catch {
      return
    }

    switch (event.type) {
      // A user item is created the moment VAD closes their turn — before the
      // transcript exists. Reserving the ordinal here is what keeps the
      // transcript in spoken order, since transcription resolves asynchronously
      // and often lands after the assistant has begun replying.
      case "conversation.item.added":
      case "conversation.item.created": {
        const id = event.item?.id
        const role = event.item?.role
        if (id && (role === "user" || role === "assistant")) this.touch(id, role)
        break
      }

      case "conversation.item.input_audio_transcription.delta":
        this.append(event.item_id, "user", event.delta ?? "")
        break

      case "conversation.item.input_audio_transcription.completed":
        this.finalise(event.item_id, "user", event.transcript ?? "")
        break

      case "conversation.item.input_audio_transcription.failed":
        // Audio was heard and answered, we just have no text for it. Drop the
        // placeholder rather than leaving an empty bubble on screen.
        this.discard(event.item_id)
        break

      case "response.output_audio_transcript.delta":
        this.append(event.item_id, "assistant", event.delta ?? "")
        break

      case "response.output_audio_transcript.done":
        this.finalise(event.item_id, "assistant", event.transcript ?? "")
        break

      case "input_audio_buffer.speech_started":
        this.handlers.onUserSpeaking(true)
        break

      case "input_audio_buffer.speech_stopped":
        this.handlers.onUserSpeaking(false)
        break

      case "error":
        this.handlers.onError({
          kind: "engine",
          message: "Hubo un problema en la conversación.",
          cause: event.error?.message,
        })
        break
    }
  }

  private touch(id: string, speaker: VoiceSpeaker): VoiceTurn {
    let turn = this.turns.get(id)
    if (!turn) {
      turn = {
        id,
        speaker,
        text: "",
        final: false,
        startedAt: new Date().toISOString(),
        ordinal: this.nextOrdinal++,
      }
      this.turns.set(id, turn)
    }
    return turn
  }

  private append(id: string | undefined, speaker: VoiceSpeaker, delta: string) {
    if (!id || !delta) return
    const turn = this.touch(id, speaker)
    turn.text += delta
    this.handlers.onTurn({ ...turn })
  }

  private finalise(id: string | undefined, speaker: VoiceSpeaker, text: string) {
    if (!id) return
    const turn = this.touch(id, speaker)
    // The completed event carries the authoritative transcript; deltas can be
    // revised by the transcription model, so prefer it when non-empty.
    turn.text = text || turn.text
    turn.final = true
    if (!turn.text.trim()) {
      this.discard(id)
      return
    }
    this.handlers.onTurn({ ...turn })
  }

  private discard(id: string | undefined) {
    if (!id) return
    const turn = this.turns.get(id)
    if (!turn) return
    this.turns.delete(id)
    this.handlers.onTurn({ ...turn, text: "", final: true })
  }

  private send(event: Record<string, unknown>) {
    if (this.channel?.readyState === "open") this.channel.send(JSON.stringify(event))
  }

  /**
   * Hold the conversation without ending it: the Realtime session and the peer
   * connection stay open, so resuming continues the SAME conversation with all
   * its context — no replaying history.
   *
   * "Paused" means the mic is genuinely off, not merely ignored: the track is
   * detached from the sender (so nothing is transmitted — a disabled track
   * would still stream billable silence) and then stopped, which releases the
   * hardware and turns off the OS recording indicator. That matters here,
   * because the reason to pause is usually that someone else started talking.
   */
  pause(): void {
    if (this.stopped || this.paused || !this.pc) return
    this.paused = true

    // Cut her off mid-sentence if she's speaking, and drop whatever half-heard
    // audio is buffered so it can't be committed as a turn on resume.
    this.send({ type: "response.cancel" })
    this.send({ type: "input_audio_buffer.clear" })
    this.audioElement?.pause()

    void this.micSender?.replaceTrack(null)
    this.micStream?.getTracks().forEach((t) => t.stop())
    this.micStream = null
  }

  async resume(): Promise<void> {
    if (this.stopped || !this.paused) return

    // The connection can die while paused (backgrounded on iOS, network lost).
    // Say so rather than reopening a mic into a dead session.
    if (!this.pc || this.pc.connectionState === "failed" || this.pc.connectionState === "closed") {
      this.handlers.onError({
        kind: "network",
        message: "La conversación se cortó mientras estaba en pausa. Lo que hablaste quedó guardado.",
      })
      return
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS)
    } catch (err) {
      this.handlers.onError({
        kind: "mic-unavailable",
        message: "No pudimos volver a abrir el micrófono. Probá de nuevo.",
        cause: err,
      })
      return
    }
    if (this.stopped) {
      stream.getTracks().forEach((t) => t.stop())
      return
    }

    this.micStream = stream
    const track = stream.getAudioTracks()[0] ?? null
    await this.micSender?.replaceTrack(track)
    void this.audioElement?.play().catch(() => {})
    this.paused = false
  }

  stop(): void {
    if (this.stopped) return
    this.stopped = true
    this.teardown()
    this.handlers.onClose()
  }

  /** Release hardware and sockets. Safe to call twice. */
  private teardown() {
    this.channel?.close()
    this.channel = null
    this.pc?.close()
    this.pc = null
    // Releasing the tracks is what turns off the iOS recording indicator; not
    // doing it leaves the mic visibly hot after the parent has stopped.
    this.micStream?.getTracks().forEach((t) => t.stop())
    this.micStream = null
  }
}

export const createOpenAIRealtimeEngine: VoiceEngineFactory = (handlers) =>
  new OpenAIRealtimeEngine(handlers)
