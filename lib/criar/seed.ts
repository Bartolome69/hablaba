// One realistic example day so the UI is reviewable immediately:
// Teo + today's bedtime pack + 2 captures (one already taught in the pack,
// one still pending for tomorrow's pack). Idempotent — runs once.

import type { CriarCapture, CriarChild, CriarPack } from "./types"
import { deriveStage } from "./stage"
import { getChild, saveChild, savePack, todayKey, listCaptures } from "./store"

export function ensureSeeded(): CriarChild {
  const existing = getChild()
  if (existing) return existing

  const now = new Date()
  const child: CriarChild = {
    id: crypto.randomUUID(),
    name: "Teo",
    birthdate: "2026-05-21",
    targetLanguage: "es",
    dialect: "rioplatense",
    parentIds: [],
    createdAt: now.toISOString(),
  }
  saveChild(child)

  const packId = crypto.randomUUID()
  const hiccupsCaptureId = crypto.randomUUID()

  const captures: CriarCapture[] = [
    {
      id: hiccupsCaptureId,
      childId: child.id,
      text: "he's got hiccups again",
      status: "taught",
      createdAt: new Date(now.getTime() - 26 * 3600_000).toISOString(),
      taughtInPackId: packId,
    },
    {
      id: crypto.randomUUID(),
      childId: child.id,
      text: "does he need burping? / bring up his wind",
      status: "new",
      createdAt: new Date(now.getTime() - 3 * 3600_000).toISOString(),
    },
  ]
  try {
    localStorage.setItem(
      "criar_captures",
      JSON.stringify([...captures, ...listCaptures(child.id)]),
    )
  } catch {}

  const phrase = (spanish: string, english: string, note?: string) => ({
    id: crypto.randomUUID(),
    spanish,
    english,
    ...(note ? { note } : {}),
    learned: false,
  })

  const pack: CriarPack = {
    id: packId,
    childId: child.id,
    date: todayKey(now),
    stage: deriveStage(child.birthdate, now),
    moment: "bedtime",
    phrases: [
      phrase("Ya está, mi amor, es hora de dormir.", "That's it, my love, it's time to sleep."),
      phrase("¿Tenés sueñito, Teo?", "Are you sleepy, Teo?"),
      phrase("Vení, upa, que te llevo a la cuna.", "Come here, up you come — I'll carry you to your cot.", "«Upa» is what Argentine parents say when picking a baby up."),
      phrase("Shhh, tranquilo, acá está papá.", "Shhh, easy now, daddy's here."),
      phrase("Te pongo el pijamita y listo.", "Let's get your little pyjamas on and we're all set."),
      phrase("Qué bostezo enorme, ¡estás re cansado!", "What a huge yawn — you're so tired!", "«Re» is the classic Argentine intensifier: re cansado, re lindo."),
      phrase("Cerrá esos ojitos.", "Close those little eyes."),
      phrase("Apagamos la luz, ¿dale?", "Let's turn off the light, okay?", "«Dale» is the Argentine 'okay/come on' — never «vale»."),
      phrase("Mañana seguimos jugando, ahora a mimir.", "We'll keep playing tomorrow — now off to sleepy-land.", "«Mimir» is baby-talk for dormir."),
      phrase("Soñá con cosas lindas.", "Dream of lovely things."),
      phrase("Papá te quiere con todo el corazón.", "Daddy loves you with all his heart."),
      phrase("Buenas noches, mi vida. Hasta mañana.", "Good night, my darling. See you tomorrow."),
    ],
    song: {
      title: "Arrorró mi niño",
      kind: "nana",
      lyrics:
        "Arrorró mi niño,\narrorró mi sol,\narrorró pedazo\nde mi corazón.\n\nEste niño lindo\nse quiere dormir\ny el pícaro sueño\nno quiere venir.",
      english:
        "Hushabye my little one,\nhushabye my sun,\nhushabye little piece\nof my heart.\n\nThis lovely child\nwants to fall asleep\nbut mischievous sleep\nrefuses to come.",
    },
    captureLessons: [
      {
        captureId: hiccupsCaptureId,
        request: "he's got hiccups again",
        spanish: "Le agarró hipo otra vez.",
        variants: ["Tiene hipo de nuevo.", "No se le va el hipo."],
        note: "«Agarrar» is the everyday Argentine verb for catching/getting something: le agarró hipo, le agarró frío, me agarró sueño.",
      },
    ],
    createdAt: now.toISOString(),
  }
  savePack(pack)

  return child
}
