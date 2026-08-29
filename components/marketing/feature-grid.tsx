import { DuoIcon, type IconName } from "@/components/icons"

interface Feature {
  title: string
  body: string
  emoji?: string
}

interface FeatureGridProps {
  heading?: string
  features: Feature[]
}

// The audience data still carries emoji (it predates the icon system); map
// them onto the duotone set so no emoji reaches the page.
const EMOJI_ICONS: Record<string, IconName> = {
  "⏱️": "tiempo",
  "✈️": "avion",
  "🇪🇸": "charlar",
  "🌎": "paseo",
  "🌱": "brote",
  "🍼": "peque",
  "🎧": "escuchar",
  "🏠": "casa",
  "👨‍👩‍👧": "familia",
  "💛": "calmar",
  "💬": "charlar",
  "📈": "onda",
  "🔁": "repasar",
  "🕯️": "dormir",
  "🗣️": "micro",
  "🛁": "bano",
  "🤝": "familia",
  "🩹": "calmar",
}

export function FeatureGrid({ heading, features }: FeatureGridProps) {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
      {heading && (
        <h2 className="mb-10 text-center font-serif text-[32px] tracking-[-0.02em] text-ink sm:text-[40px]">
          {heading}
        </h2>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="clay-static rounded-[22px] p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-green-tint text-ink">
              <DuoIcon name={(f.emoji && EMOJI_ICONS[f.emoji]) || "brote"} size={24} />
            </div>
            <h3 className="font-serif text-[20px] tracking-[-0.01em] text-ink">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
