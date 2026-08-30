import Link from "next/link"
import type { Metadata } from "next"
import { DuoIcon, grammarIcon } from "@/components/icons"
import { HomeHero } from "@/components/marketing/home-hero"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { WaitlistForm } from "@/components/marketing/waitlist-form"
import { FeatureGrid } from "@/components/marketing/feature-grid"
import { Faq } from "@/components/marketing/faq"
import { audiences } from "@/lib/marketing/audiences"
import { coveredTopics } from "@/lib/exercises/content"
import { phrasePages } from "@/lib/marketing/phrase-pages"
import { routines } from "@/lib/routines"

export const metadata: Metadata = {
  title: "Hablaba: speak Spanish with your little one",
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
      <HomeHero
        stats={{
          phrases: routines.reduce((n, r) => n + r.phrases.length, 0),
          topics: covered.length,
          questions: totalQuestions,
        }}
      />

      <HowItWorks
        id="how-it-works"
        steps={[
          { title: "Talk about your day", body: "Type at the kitchen table, or go hands-free on a walk with the pram. It's one conversation about your real life." },
          { title: "Get patterns back", body: "Hablaba notices what you fumbled and what you nailed, and turns it into gentle, specific practice." },
          { title: "Bring it home", body: "Phrases for bath time and bedtime land in your library, ready to use with your peque tonight." },
        ]}
      />

      {/* The email form lives in the hero; this band is the taste of the
          product: the free on-site exercises. */}
      <section className="mx-auto max-w-2xl px-5 py-14 text-center sm:py-16">
        <h2 className="font-serif text-[26px] tracking-[-0.015em] text-ink sm:text-[30px]">
          Try it before you sign up
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {totalQuestions} free practice questions across {covered.length} grammar topics, graded
          right on the page. No account, no app.
        </p>
        <Link
          href="/gramatica"
          className="clay-green mt-5 inline-flex h-12 items-center justify-center rounded-full px-7 text-[15px] font-semibold text-cream"
        >
          Try the free exercises
        </Link>
      </section>

      {/* Free content — the SEO families, front and centre. */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-[28px] tracking-[-0.02em] text-ink sm:text-[32px]">
              Phrases for the moments that matter
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Free packs of the Spanish parents actually say at nappy changes, in the bath, and at
              lights out. English translations included.
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
              {totalQuestions} free questions you can try right on the page.
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
          { q: "What level is Hablaba for?", a: "We're built for B1-ish learners: you can read a menu and survive a chat, but you freeze in real conversation. We also support beginners with a bilingual partner." },
          { q: "Does my child need to use it?", a: "No. Hablaba is for the parent: you practise the Spanish, then bring it into bath time, bedtime and the walk to nursery yourself. There's even a mode where your partner plays your little one so you can rehearse the day." },
          { q: "How long per session?", a: "Five minutes is the sweet spot. Short, daily sessions beat long, occasional ones, and voice conversations work hands-free while you push the pram." },
          { q: "Do I need to install anything?", a: "No. Hablaba runs in your browser, and you can add it to your home screen as an app in one tap." },
          { q: "How much does it cost?", a: "Hablaba is free during the early access period, and the grammar and phrase libraries on this site are free forever. Join the waitlist to be the first in." },
        ]}
      />

      {/* The page ends where it began: on the one conversion. */}
      <section className="mx-auto max-w-2xl px-5 pb-20 text-center">
        <h2 className="font-serif text-[26px] tracking-[-0.015em] text-ink sm:text-[30px]">
          Be first in when invites go out
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Early access to Hablaba, plus one new routine of parent Spanish a week. Free.
        </p>
        <div className="mt-5 flex justify-center">
          <WaitlistForm placement="page-end" />
        </div>
      </section>
    </>
  )
}
