// The phrases hub: every routine phrase pack, published openly, led by the
// bilingual-parenting routines — the front door of the /frases SEO family.

import Link from "next/link"
import type { Metadata } from "next"
import { DuoIcon, type IconName } from "@/components/icons"
import { phrasePages } from "@/lib/marketing/phrase-pages"
import { categories, routines } from "@/lib/routines"

export const metadata: Metadata = {
  title: "Spanish phrases for real life with a baby — free routine packs",
  description:
    "Nappy changes, bath time, bedtime, the café, the playground: the Spanish parents actually say, in free phrase packs with English translations. For raising a bilingual baby one routine at a time.",
  alternates: { canonical: "/frases" },
}

const CATEGORY_ICONS: Record<string, IconName> = {
  baby: "peque",
  smalltalk: "pensamiento",
  cafe: "taza",
  travel: "avion",
}

const CATEGORY_HEADINGS: Record<string, string> = {
  baby: "With your baby",
  smalltalk: "Small talk",
  cafe: "Cafés & bakeries",
  travel: "Getting around",
}

// Baby routines lead — this library exists for bilingual parenting first.
const CATEGORY_ORDER = ["baby", "smalltalk", "cafe", "travel"]

export default function PhrasesIndexPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pb-20 pt-12 sm:pt-16">
      <header className="max-w-2xl">
        <p className="mb-4 inline-flex rounded-full bg-terracotta-tint px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[.16em] text-terracotta-ink">
          Free phrase packs
        </p>
        <h1 className="font-serif text-[40px] leading-[1.05] tracking-[-0.025em] text-ink sm:text-6xl">
          The Spanish your day is actually made of.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
          Not textbook dialogues — the lines parents really say at the changing table, in the
          bath, at the swings and in the café queue. Every pack is free, with English
          translations and a tip for making it stick.
        </p>
      </header>

      {CATEGORY_ORDER.map((catId) => {
        const category = categories.find((c) => c.id === catId)
        const group = routines.filter((r) => r.category === catId && phrasePages[r.id])
        if (!category || group.length === 0) return null
        return (
          <section key={catId} className="mt-12">
            <h2 className="smallcaps px-1 text-ink-faint">{CATEGORY_HEADINGS[catId]}</h2>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {group.map((routine) => (
                <Link
                  key={routine.id}
                  href={`/frases/${routine.id}`}
                  className="clay-card flex items-center gap-3.5 rounded-[20px] p-4"
                >
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-green-tint text-ink">
                    <DuoIcon name={CATEGORY_ICONS[catId] ?? "brote"} size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-ink">{routine.name}</p>
                    <p className="truncate text-[13px] text-ink-soft">{routine.context}</p>
                  </div>
                  <span className="flex-none text-[12.5px] text-ink-soft">{routine.phrases.length} frases</span>
                </Link>
              ))}
            </div>
          </section>
        )
      })}

      <section className="clay-green-hero mt-14 rounded-[26px] p-6 sm:p-8">
        <h2 className="font-serif text-[26px] leading-tight tracking-[-0.015em] text-cream">
          Phrases are the start — the conversation is the point
        </h2>
        <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-green-on-dark">
          Hablaba puts every pack in your pocket with audio, tracks which phrases you've
          actually used, and gives you a warm Argentine partner to try them on — typed at the
          kitchen table, or hands-free on a walk with the pram.
        </p>
        <Link
          href="/app/speak"
          className="clay-cream mt-5 inline-flex h-12 items-center rounded-full px-7 text-[15px] font-semibold text-green"
        >
          Try Hablaba free
        </Link>
      </section>
    </div>
  )
}
