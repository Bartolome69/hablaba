// The grammar library index: every topic the app can drill, grouped by area,
// published openly. The hub page of the /gramatica SEO family.

import Link from "next/link"
import type { Metadata } from "next"
import { DuoIcon, grammarIcon } from "@/components/icons"
import { coveredTopics } from "@/lib/exercises/content"
import type { GrammarArea } from "@/lib/exercises/types"

export const metadata: Metadata = {
  title: "Free Spanish grammar exercises — A2 to B2, with clear rules",
  description:
    "Ser vs estar, por vs para, the subjunctive, commands and more: clear rules, real examples and hundreds of free practice questions, built for parents learning Spanish for daily life.",
  alternates: { canonical: "/gramatica" },
}

const AREA_ORDER: GrammarArea[] = [
  "verbs",
  "tenses",
  "mood",
  "prepositions",
  "pronouns",
  "comparison",
  "usage",
]

const AREA_HEADINGS: Record<GrammarArea, string> = {
  verbs: "The verbs themselves",
  tenses: "Past & future tenses",
  mood: "Subjunctive & commands",
  prepositions: "Prepositions",
  pronouns: "Pronouns",
  comparison: "Comparing things",
  usage: "Confusable words",
}

export default function GrammarIndexPage() {
  const covered = coveredTopics()
  const totalQuestions = covered.reduce((n, c) => n + c.totalCount, 0)

  return (
    <div className="mx-auto max-w-4xl px-5 pb-20 pt-12 sm:pt-16">
      <header className="max-w-2xl">
        <p className="mb-4 inline-flex rounded-full bg-terracotta-tint px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[.16em] text-terracotta-ink">
          Free practice
        </p>
        <h1 className="font-serif text-[40px] leading-[1.05] tracking-[-0.025em] text-ink sm:text-6xl">
          Spanish grammar, one calm rule at a time.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
          {covered.length} topics from A2 to B2, each with the rule in plain English, real
          examples, and free practice questions — {totalQuestions} in all. No account, no
          streaks, no pressure.
        </p>
      </header>

      {AREA_ORDER.map((area) => {
        const group = covered.filter((c) => c.topic.area === area)
        if (group.length === 0) return null
        return (
          <section key={area} className="mt-12">
            <h2 className="smallcaps px-1 text-ink-faint">{AREA_HEADINGS[area]}</h2>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {group.map(({ topic, totalCount }) => (
                <Link
                  key={topic.id}
                  href={`/gramatica/${topic.id}`}
                  className="clay-card flex items-center gap-3.5 rounded-[20px] p-4"
                >
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-green-tint text-ink">
                    <DuoIcon name={grammarIcon(topic.id)} size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-ink">{topic.title}</p>
                    <p className="truncate font-serif text-[13.5px] italic text-ink-soft">{topic.spanish}</p>
                  </div>
                  <div className="flex flex-none flex-col items-end gap-0.5 text-right">
                    <span className="text-[11px] font-medium uppercase tracking-[.14em] text-ink-faint">{topic.cefr}</span>
                    <span className="text-[12.5px] text-ink-soft">{totalCount} Q</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )
      })}

      <section className="clay-green-hero mt-14 rounded-[26px] p-6 sm:p-8">
        <h2 className="font-serif text-[26px] leading-tight tracking-[-0.015em] text-cream">
          Grammar that comes from your own conversations
        </h2>
        <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-green-on-dark">
          In Hablaba, you talk — typed or out loud — and the app notices which of these rules
          you actually fumble, then sends you to exactly the right quiz. That loop is the app.
        </p>
        <Link
          href="/app/today"
          className="clay-cream mt-5 inline-flex h-12 items-center rounded-full px-7 text-[15px] font-semibold text-green"
        >
          Try Hablaba free
        </Link>
      </section>
    </div>
  )
}
