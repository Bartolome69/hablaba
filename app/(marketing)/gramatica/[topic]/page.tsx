// One public grammar page per taxonomy topic — the SEO play: the app's own
// lesson summaries, examples and questions, published where search can find
// them. Every page carries a real interactive quiz (TryIt), so the page IS
// the product, not an ad for it.

import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { DuoIcon, grammarIcon } from "@/components/icons"
import { TryIt } from "@/components/marketing/try-it"
import { WaitlistForm } from "@/components/marketing/waitlist-form"
import { coveredTopics, itemsForTopic, lessonsForTopic } from "@/lib/exercises/content"
import { isClientGradable } from "@/lib/exercises/grade"
import { getTopic, topics } from "@/lib/exercises/taxonomy"
import { SITE_URL } from "@/lib/site"

interface PageProps {
  params: Promise<{ topic: string }>
}

export function generateStaticParams() {
  return coveredTopics().map((c) => ({ topic: c.topic.id }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { topic: id } = await params
  const topic = getTopic(id)
  if (!topic) return {}
  const count = itemsForTopic(id).length
  const title = `${topic.title} in Spanish: rules and free exercises`
  const description = `${topic.blurb} Clear rules, real examples, and ${count} free practice questions at ${topic.cefr} level, made for parents learning Spanish for daily life.`
  return {
    title,
    description,
    alternates: { canonical: `/gramatica/${id}` },
    openGraph: { title, description, url: `/gramatica/${id}`, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  }
}

/**
 * Split a long lesson summary into readable paragraphs. Splits only after a
 * full stop followed by a capital — a lossless split, so quoted Spanish
 * («¡Esta sopa está buena!») can never be mangled.
 */
function paragraphs(summary: string): string[] {
  const sentences = summary.split(/(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ¡¿«])/)
  const paraCount = Math.min(3, Math.max(1, Math.ceil(sentences.length / 4)))
  const perPara = Math.ceil(sentences.length / paraCount)
  const out: string[] = []
  for (let i = 0; i < sentences.length; i += perPara) {
    out.push(sentences.slice(i, i + perPara).join(" ").trim())
  }
  return out.filter(Boolean)
}

export default async function GrammarTopicPage({ params }: PageProps) {
  const { topic: id } = await params
  const topic = getTopic(id)
  if (!topic) notFound()

  const lessons = lessonsForTopic(id)
  if (lessons.length === 0) notFound()
  // Multiple packs can cover a topic — teach from the fullest summary.
  const lesson = [...lessons].sort((a, b) => b.summary.length - a.summary.length)[0]
  const seen = new Set<string>()
  const examples = lessons
    .flatMap((l) => l.examples)
    .filter((e) => !seen.has(e.spanish) && seen.add(e.spanish))
    .slice(0, 6)

  const items = itemsForTopic(id)
  const tryItems = items
    .filter((i) => i.type === "choice" && isClientGradable(i))
    .sort((a, b) => a.difficulty - b.difficulty)
    .slice(0, 3)

  const related = topics.filter((t) => t.area === topic.area && t.id !== id).slice(0, 4)

  return (
    <article className="mx-auto max-w-3xl px-5 pb-20 pt-10 sm:pt-14">
      <nav className="flex items-center gap-1.5 text-[13px] text-ink-soft" aria-label="Breadcrumb">
        <Link href="/gramatica" className="hover:text-ink">Spanish grammar</Link>
        <DuoIcon name="chevron" size={12} />
        <span className="text-ink-muted">{topic.title}</span>
      </nav>

      <header className="mt-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-green-tint text-ink">
            <DuoIcon name={grammarIcon(id)} size={26} />
          </div>
          <div>
            <h1 className="font-serif text-[34px] leading-[1.05] tracking-[-0.025em] text-ink sm:text-5xl">
              {topic.title}
            </h1>
            <p className="mt-1 font-serif text-lg italic text-ink-soft">{topic.spanish}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-terracotta-tint px-3 py-1 text-[11px] font-medium uppercase tracking-[.14em] text-terracotta-ink">
            {topic.cefr}
          </span>
          <span className="rounded-full bg-sunken px-3 py-1 text-[12.5px] text-ink-muted">
            {items.length} practice questions
          </span>
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">{topic.blurb}</p>
      </header>

      <section className="mt-10">
        <h2 className="font-serif text-[24px] tracking-[-0.01em] text-ink">The rule</h2>
        <div className="mt-3 space-y-4">
          {paragraphs(lesson.summary).map((p, i) => (
            <p key={i} className="text-[15.5px] leading-[1.7] text-ink text-pretty">{p}</p>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-[24px] tracking-[-0.01em] text-ink">Examples</h2>
        <ul className="mt-4 space-y-2.5">
          {examples.map((e) => (
            <li key={e.spanish} className="clay-static rounded-[18px] px-5 py-4">
              <p className="font-serif text-[19px] leading-snug text-ink">{e.spanish}</p>
              <p className="mt-1 text-[13.5px] text-ink-soft">
                {e.english}
                {e.note && <span className="text-ink-faint"> ({e.note})</span>}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {tryItems.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-[24px] tracking-[-0.01em] text-ink">Try it yourself</h2>
          <p className="mb-4 mt-1 text-sm text-ink-muted">
            Three quick questions, straight from the app. No sign-up needed.
          </p>
          <TryIt items={tryItems} topicId={id} topicTitle={topic.title} />
        </section>
      )}

      <section className="clay-green-hero mt-12 rounded-[26px] p-6 sm:p-8">
        <h2 className="font-serif text-[26px] leading-tight tracking-[-0.015em] text-cream">
          All {items.length} {topic.title} questions, free in Hablaba
        </h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-green-on-dark">
          Hablaba spots this exact rule in your real conversations and points you back to the
          quiz for it. The drills feed the speaking, which is the point of the whole app.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Link
            href={`/app/exercises?topic=${id}`}
            className="clay-cream inline-flex h-12 items-center rounded-full px-7 text-[15px] font-semibold text-green"
          >
            Start the quiz
          </Link>
          <span className="text-sm text-green-on-dark">No account needed</span>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="smallcaps text-ink-faint">Keep going</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {related.map((t) => (
              <Link
                key={t.id}
                href={`/gramatica/${t.id}`}
                className="clay-card flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink"
              >
                <DuoIcon name={grammarIcon(t.id)} size={16} />
                {t.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 border-t border-rule pt-8">
        <p className="mb-3 text-sm font-medium text-ink">Get one new rule like this each week:</p>
        <WaitlistForm placement="grammar-page" />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LearningResource",
            name: `${topic.title} in Spanish (${topic.spanish})`,
            description: topic.blurb,
            educationalLevel: topic.cefr,
            inLanguage: "en",
            teaches: topic.spanish,
            learningResourceType: "Lesson with practice exercises",
            provider: { "@type": "Organization", name: "Hablaba", url: SITE_URL },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Spanish grammar", item: `${SITE_URL}/gramatica` },
              { "@type": "ListItem", position: 2, name: topic.title, item: `${SITE_URL}/gramatica/${id}` },
            ],
          }),
        }}
      />
    </article>
  )
}
