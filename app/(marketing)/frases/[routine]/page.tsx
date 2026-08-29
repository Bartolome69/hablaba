// One public phrase page per routine — the bilingual-parenting SEO family.
// The phrase lists come straight from the app's routine library; the framing
// copy lives in lib/marketing/phrase-pages.ts.

import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { DuoIcon, type IconName } from "@/components/icons"
import { WaitlistForm } from "@/components/marketing/waitlist-form"
import { phrasePages } from "@/lib/marketing/phrase-pages"
import { categories, routines } from "@/lib/routines"
import { SITE_URL } from "@/lib/site"

const CATEGORY_ICONS: Record<string, IconName> = {
  baby: "peque",
  smalltalk: "pensamiento",
  cafe: "taza",
  travel: "avion",
}

interface PageProps {
  params: Promise<{ routine: string }>
}

export function generateStaticParams() {
  return routines.filter((r) => phrasePages[r.id]).map((r) => ({ routine: r.id }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { routine: id } = await params
  const copy = phrasePages[id]
  if (!copy) return {}
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: { canonical: `/frases/${id}` },
    openGraph: { title: copy.metaTitle, description: copy.metaDescription, url: `/frases/${id}`, type: "article" },
    twitter: { card: "summary_large_image", title: copy.metaTitle, description: copy.metaDescription },
  }
}

export default async function PhrasePage({ params }: PageProps) {
  const { routine: id } = await params
  const routine = routines.find((r) => r.id === id)
  const copy = phrasePages[id]
  if (!routine || !copy) notFound()

  const category = categories.find((c) => c.id === routine.category)
  const related = routines.filter((r) => r.category === routine.category && r.id !== id && phrasePages[r.id])

  return (
    <article className="mx-auto max-w-3xl px-5 pb-20 pt-10 sm:pt-14">
      <nav className="flex items-center gap-1.5 text-[13px] text-ink-soft" aria-label="Breadcrumb">
        <Link href="/frases" className="hover:text-ink">Spanish phrases</Link>
        <DuoIcon name="chevron" size={12} />
        <span className="text-ink-muted">{routine.name}</span>
      </nav>

      <header className="mt-6">
        <div className="flex items-start gap-3.5">
          <div className="mt-1 flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-green-tint text-ink">
            <DuoIcon name={CATEGORY_ICONS[routine.category] ?? "brote"} size={26} />
          </div>
          <div>
            <h1 className="font-serif text-[34px] leading-[1.08] tracking-[-0.025em] text-ink sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-2 text-[14.5px] text-ink-soft">{routine.context}</p>
          </div>
        </div>
        <p className="mt-6 max-w-2xl text-[15.5px] leading-[1.7] text-ink text-pretty">{copy.intro}</p>
      </header>

      <section className="mt-8">
        <h2 className="smallcaps text-ink-faint">The phrases</h2>
        <ul className="mt-3 space-y-2.5">
          {routine.phrases.map((p) => (
            <li key={p.spanish} className="clay-static rounded-[18px] px-5 py-4">
              <p className="font-serif text-[21px] leading-snug text-ink">{p.spanish}</p>
              <p className="mt-1 text-[13.5px] text-ink-soft">{p.english}</p>
            </li>
          ))}
        </ul>
      </section>

      <aside className="mt-6 flex gap-3 rounded-[20px] bg-sunken p-5">
        <DuoIcon name="pista" size={20} className="mt-0.5 flex-none" />
        <div>
          <p className="text-[13.5px] font-semibold text-ink">How to make it stick</p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-ink-muted">{copy.tip}</p>
        </div>
      </aside>

      <section className="clay-green-hero mt-12 rounded-[26px] p-6 sm:p-8">
        <h2 className="font-serif text-[26px] leading-tight tracking-[-0.015em] text-cream">
          Hear them, say them, keep them
        </h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-green-on-dark">
          In Hablaba every one of these phrases has audio, lives in your own library, and comes
          back at the right moment. There's also a warm Spanish-speaking partner to practise
          them on, by text or out loud.
        </p>
        <Link
          href="/app/speak"
          className="clay-cream mt-5 inline-flex h-12 items-center rounded-full px-7 text-[15px] font-semibold text-green"
        >
          Open the phrase library free
        </Link>
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="smallcaps text-ink-faint">More {category?.label.toLowerCase() ?? ""} phrases</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/frases/${r.id}`}
                className="clay-card flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink"
              >
                {phrasePages[r.id].title.replace(/^Spanish (phrases )?(for )?/i, "").replace(/ in Spanish$/i, "")}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 border-t border-rule pt-8">
        <p className="mb-3 text-sm font-medium text-ink">One new routine like this each week, free:</p>
        <WaitlistForm placement="phrase-page" />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: copy.title,
            description: copy.metaDescription,
            inLanguage: "en",
            about: "Spanish language learning for parents",
            publisher: { "@type": "Organization", name: "Hablaba", url: SITE_URL },
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
              { "@type": "ListItem", position: 1, name: "Spanish phrases", item: `${SITE_URL}/frases` },
              { "@type": "ListItem", position: 2, name: routine.name, item: `${SITE_URL}/frases/${id}` },
            ],
          }),
        }}
      />
    </article>
  )
}
