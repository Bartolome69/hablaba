import Link from "next/link"
import type { Metadata } from "next"
import { Hero } from "@/components/marketing/hero"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { FeatureGrid } from "@/components/marketing/feature-grid"
import { Faq } from "@/components/marketing/faq"
import { audiences } from "@/lib/marketing/audiences"

export const metadata: Metadata = {
  title: "Hablaba — Speak Spanish with your little one",
  description:
    "Hablaba helps parents raise bilingual kids and B1 learners practice real conversation. Warm, calm, encouraging — Spanish for daily life.",
  alternates: { canonical: "/" },
}

const useCases = [
  { slug: "parents", label: "Parents", body: "Speak Spanish with your kid, even if you're still learning." },
  { slug: "toddlers", label: "Toddlers", body: "Real phrases for bath, snack, bedtime." },
  { slug: "b1-learners", label: "B1 learners", body: "Past Duolingo? Have real conversations." },
  { slug: "travelers", label: "Travelers", body: "Trip-ready Spanish in two weeks." },
  { slug: "expats", label: "Expats", body: "Settle into life in Spanish." },
  { slug: "beginners-with-kids", label: "New parents", body: "Catch up to your bilingual partner." },
]

export default function HomePage() {
  return (
    <>
      <Hero
        eyebrow="Spanish for daily life"
        headline="Speak Spanish with your little one — even if you're still learning."
        subhead="Hablaba is the patient, warm Spanish companion for parents raising bilingual kids and learners stuck at B1. Five minutes a day. Real conversations. Gentle corrections."
      />

      <HowItWorks
        steps={[
          { title: "Pick a moment", body: "A routine, a topic, a destination — something you'll actually use this week." },
          { title: "Practice out loud", body: "Listen, repeat, get a kind correction. No shame, no flashcards." },
          { title: "Bring it home", body: "Use the phrase tonight. Tomorrow, learn one more." },
        ]}
      />

      <FeatureGrid
        heading="Built for the moments that matter"
        features={audiences.parents.features}
      />

      <section className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <h2 className="mb-10 text-center font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Hablaba is for…
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((u) => (
            <Link
              key={u.slug}
              href={`/for/${u.slug}`}
              className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary"
            >
              <p className="font-serif text-lg font-semibold">{u.label}</p>
              <p className="mt-2 text-sm text-muted-foreground">{u.body}</p>
              <p className="mt-4 text-sm font-medium text-primary">Learn more →</p>
            </Link>
          ))}
        </div>
      </section>

      <Faq
        items={[
          { q: "What level is Hablaba for?", a: "We're built for B1-ish learners — you can read a menu and survive a chat, but you freeze in real conversation. We also support beginners with a bilingual partner." },
          { q: "How long per session?", a: "Five minutes is the sweet spot. Short, daily sessions beat long, occasional ones." },
          { q: "Do I need to install anything?", a: "No — Hablaba runs in your browser. iOS and Android apps are coming." },
          { q: "How much does it cost?", a: "Hablaba is free during the early access period. Join the waitlist to be the first in." },
        ]}
      />
    </>
  )
}
