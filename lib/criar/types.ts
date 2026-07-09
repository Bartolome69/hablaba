// Criar module types. These records are table-shaped on purpose:
// criar_children / criar_packs / criar_captures map 1:1 to future SQL tables.

export type CriarStage = "newborn" | "toddler" | "preschool" | "school-age"

export interface CriarChild {
  id: string
  name: string
  birthdate: string // YYYY-MM-DD
  targetLanguage: string // ISO 639-1, e.g. "es"
  dialect: string // e.g. "rioplatense"
  parentIds: string[] // multi-parent support is schema-only for now
  createdAt: string // ISO datetime
}

export type CriarMomentId =
  | "waking"
  | "feed"
  | "nappy"
  | "pram-walk"
  | "bath"
  | "bedtime"
  | "soothing"

export interface CriarMoment {
  id: CriarMomentId
  label: string
  emoji: string
}

export type CriarCaptureStatus = "new" | "taught" | "learning" | "learned"

export interface CriarCapture {
  id: string
  childId: string
  text: string // what the parent couldn't say, in whatever language it came out
  status: CriarCaptureStatus
  createdAt: string // ISO datetime
  taughtInPackId?: string
}

export interface CriarPackPhrase {
  id: string
  spanish: string
  english: string
  note?: string
  learned: boolean
}

export interface CriarPackSong {
  title: string
  kind: "nana" | "rima" | "canción"
  lyrics: string
  english: string
}

export interface CriarCaptureLesson {
  captureId: string
  request: string // the original capture text
  spanish: string // the Rioplatense way to say it
  variants: string[]
  note: string
}

export interface CriarPack {
  id: string
  childId: string
  date: string // YYYY-MM-DD, one pack per child per day
  stage: CriarStage
  moment: CriarMomentId
  phrases: CriarPackPhrase[]
  song: CriarPackSong
  captureLessons: CriarCaptureLesson[]
  createdAt: string // ISO datetime
}

// --- /api/criar/pack request/response ---

export interface PackApiRequest {
  childName: string
  ageDescription: string
  stage: CriarStage
  moment: CriarMomentId
  captures: { id: string; text: string }[]
  reinforcePhrases: string[] // recent, not yet learned — recycle some of these
  avoidPhrases: string[] // marked learned — don't repeat
}

export interface PackApiResponse {
  phrases: { spanish: string; english: string; note?: string }[]
  song: CriarPackSong
  captureLessons: CriarCaptureLesson[]
}
