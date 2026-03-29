export type VoiceId = "nova" | "shimmer" | "alloy" | "onyx" | "echo" | "fable"

export interface Voice {
  id: VoiceId
  name: string
  descriptor: string
}

export const voices: Voice[] = [
  { id: "nova",    name: "Elena",     descriptor: "Warm" },
  { id: "shimmer", name: "Sofía",     descriptor: "Bright" },
  { id: "alloy",   name: "Valentina", descriptor: "Clear" },
  { id: "onyx",    name: "Carlos",    descriptor: "Deep" },
  { id: "echo",    name: "Marcos",    descriptor: "Natural" },
  { id: "fable",   name: "Diego",     descriptor: "Expressive" },
]

export const defaultVoiceId: VoiceId = "nova"
