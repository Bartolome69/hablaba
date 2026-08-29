import Link from "next/link"
import type { Metadata } from "next"
import { DuoIcon, grammarIcon } from "@/components/icons"
import { Hero } from "@/components/marketing/hero"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { FeatureGrid } from "@/components/marketing/feature-grid"
import { Faq } from "@/components/marketing/faq"
import { audiences } from "@/lib/marketing/audiences"
import { coveredTopics } from "@/lib/exercises/content"
import { phrasePages } from "@/lib/marketing/phrase-pages"
import { routines } from "@/lib/routines"

export const metadata: Metadata = {
  title: "Hablaba — Speak Spanish with your little one",
  description:
    "Hablaba helps parents raise bilingual kids: real conversations with a warm Spanish partner, phrases for bath time and bedtime, and grammar practice built from what you actually say.",
  alternates: { canonical: "/" },
}

const useCases = [
  { slug: "parents", label: "Parents", body: "Speak Spanish with your kid, even if you're still learning." },
  { slug: "toddlers", label: "Toddlers", body: "Real phrases for bath, snack, bedtime." },
  { slug: "beginners-with-kids", label: "New parents", body: "Catch up to your bilingual partner." },
  { slug: "b1-learners", label: "B1 learners", body: "Past Duolingo? Have real conversations." },
  { slug: "travelers", label: "Travelers", body: "Trip-ready Spanish in two weeks." },
  { slug: "expats", label: "Expats", body: "Settle into life in Spanish." },
]

// The landing page's free-content teasers — the SEO families, surfaced.
const TEASER_TOPICS = ["ser-vs-estar", "por-vs-para", "preterite-vs-imperfect", "bien-vs-buen", "gustar-verbs", "commands"]
const TEASER_ROUTINES = ["bath", "bedtime", "feeding", "diaper", "wakeup", "outside"]

export default function HomePage() {
  const covered = coveredTopics()
  const totalQuestions = covered.reduce((n, c) => n + c.totalCount, 0)
  const teaserTopics = TEASER_TOPICS.map((id) => covered.find((c) => c.topic.id === id)).filter(
    (c): c is NonNullable<typeof c> => !!c,
  )
  const teaserRoutines = TEASER_ROUTINES.map((id) => routines.find((r) => r.id === id)).filter(
    (r): r is NonNullable<typeof r> => !!r && !!phrasePages[r.id],
  )

  return (
    <>
      <Hero
        eyebrow="Spanish for bilingual parenting"
        headline="Speak Spanish with your little one — even if you're still learning."
        subhead="Hablaba is the patient, warm Spanish companion for parents raising bilingual kids. Real conversations by text or voice, phrases for the moments your day is made of, and gentle corrections that never feel like a red pen."
      />

      <HowItWorks
        steps={[
          { title: "Talk about your day", body: "Type at the kitchen table or go hands-free on a walk with the pram — one conversation, your real life." },
          { title: "Get patterns back", body: "Hablaba notices what you fumbled and what you nailed, and turns it into gentle, specific practice." },
          { title: "Bring it home", body: "Phrases for bath time and bedtime land in your library, ready to use with your peque tonight." },
        ]}
      />

      {/* Free content — the SEO families, front and centre. */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-[28px] tracking-[-0.02em] text-ink sm:text-[32px]">
              Phrases for the moments that matter
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Free packs of the Spanish parents actually say — nappy changes, the bath, lights
              out. English translations included.
            </p>
            <div className="mt-5 space-y-2">
              {teaserRoutines.map((r) => (
                <Link
                  key={r.id}
                  href={`/frases/${r.id}`}
                  className="clay-card flex items-center gap-3 rounded-[18px] px-4 py-3"
                >
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-green-tint text-ink">
                    <DuoIcon name="peque" size={18} />
                  </div>
                  <span className="flex-1 text-[15px] font-semibold text-ink">{phrasePages[r.id].title}</span>
                  <DuoIcon name="chevron" size={14} className="text-ink-soft" />
                </Link>
              ))}
            </div>
            <Link href="/frases" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-green">
              All phrase packs
              <DuoIcon name="flecha" size={14} />
            </Link>
          </div>

          <div>
            <h2 className="font-serif text-[28px] tracking-[-0.02em] text-ink sm:text-[32px]">
              Grammar, one calm rule at a time
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {covered.length} topics from A2 to B2 with clear rules, real examples and{" "}
              {totalQuestions} free questions — try them right on the page.
            </p>
            <div className="mt-5 space-y-2">
              {teaserTopics.map(({ topic, totalCount }) => (
                <Link
                  key={topic.id}
                  href={`/gramatica/${topic.id}`}
                  className="clay-card flex items-center gap-3 rounded-[18px] px-4 py-3"
                >
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-green-tint text-ink">
                    <DuoIcon name={grammarIcon(topic.id)} size={18} />
                  </div>
                  <span className="flex-1 text-[15px] font-semibold text-ink">{topic.title}</span>
                  <span className="text-[12.5px] text-ink-soft">{topic.cefr} · {totalCount} Q</span>
                </Link>
              ))}
            </div>
            <Link href="/gramatica" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-green">
              All grammar topics
              <DuoIcon name="flecha" size={14} />
            </Link>
          </div>
        </div>
      </section>

      <FeatureGrid
        heading="Built for the moments that matter"
        features={audiences.parents.features}
      />

      <section className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <h2 className="mb-10 text-center font-serif text-[32px] tracking-[-0.02em] text-ink sm:text-[40px]">
          Hablaba is for…
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((u) => (
            <Link key={u.slug} href={`/for/${u.slug}`} className="clay-card rounded-[22px] p-6">
              <p className="font-serif text-[20px] tracking-[-0.01em] text-ink">{u.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{u.body}</p>
              <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-green">
                Learn more
                <DuoIcon name="flecha" size={13} />
              </p>
            </Link>
          ))}
        </div>
      </section>

      <Faq
        items={[
          { q: "What level is Hablaba for?", a: "We're built for B1-ish learners — you can read a menu and survive a chat, but you freeze in real conversation. We also support beginners with a bilingual partner." },
          { q: "Does my child need to use it?", a: "No. Hablaba is for the parent: you practise the Spanish, then bring it into bath time, bedtime and the walk to nursery yourself. There's even a mode where your partner plays your little one so you can rehearse the day." },
          { q: "How long per session?", a: "Five minutes is the sweet spot. Short, daily sessions beat long, occasional ones — and voice conversations work hands-free while you push the pram." },
          { q: "Do I need to install anything?", a: "No — Hablaba runs in your browser, and you can add it to your home screen as an app in one tap." },
          { q: "How much does it cost?", a: "Hablaba is free during the early access period, and the grammar and phrase libraries on this site are free forever. Join the waitlist to be the first in." },
        ]}
      />
    </>
  )
}
