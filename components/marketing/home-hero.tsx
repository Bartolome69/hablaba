import Link from "next/link"
import { DuoIcon } from "@/components/icons"
import { WaitlistForm } from "@/components/marketing/waitlist-form"

// The homepage above-the-fold. One job: a tired parent, one thumb, five
// seconds. The site's single conversion is the email address, so the form IS
// the primary CTA; the free on-site exercises are the taste of the product
// (the only "try" the site offers), and the app itself is gated behind the
// waitlist. Everything is answered without a scroll: what changes (headline),
// what this is and what's inside (subhead), who it's for (eyebrow), what it
// costs and how access works (fact row), why to trust it (real content
// numbers + who builds it), where the longer story lives (#how-it-works).
// The app peek is real markup in the real design system, not a screenshot:
// on mobile it crops at the fold as the scroll cue.

interface HomeHeroStats {
  phrases: number
  topics: number
  questions: number
}

export function HomeHero({ stats }: { stats: HomeHeroStats }) {
  const proofLine = (
    <>
      {stats.phrases} routine phrases, {stats.topics} grammar topics and {stats.questions} free
      practice questions inside. Built by a dad speaking Spanish with his own little one.
    </>
  )

  return (
    <section className="mx-auto max-w-6xl px-5 pb-12 pt-7 sm:pb-16 sm:pt-14">
      <div className="grid items-center gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div>
          <p className="inline-flex rounded-full bg-terracotta-tint px-4 py-1.5 text-[11px] font-medium uppercase tracking-[.16em] text-terracotta-ink">
            For parents raising bilingual kids
          </p>

          <h1 className="mt-4 font-serif text-[36px] leading-[1.04] tracking-[-0.03em] text-ink text-balance sm:text-[54px] lg:text-[58px]">
            Speak Spanish with your little one, even if you&apos;re still learning.
          </h1>

          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-muted sm:mt-5 sm:text-[17px]">
            Hablaba is a free web app for the parent, not the child: real conversations with a
            warm Spanish partner by text or voice, phrases for bath time and bedtime, and
            grammar practice built from what you actually say.
          </p>

          <div id="waitlist" className="mt-6 scroll-mt-24 sm:mt-7">
            <WaitlistForm placement="hero" />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mt-5">
            <Link
              href="/gramatica"
              className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-green"
            >
              Or try the free exercises
              <DuoIcon name="flecha" size={14} />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink-muted"
            >
              How it works
              <DuoIcon name="chevron" size={13} className="rotate-90" />
            </Link>
          </div>

          <p className="mt-4 text-[13px] text-ink-soft sm:mt-5 sm:text-[13.5px]">
            Free while in early access · Invites go out by email · Works on your phone
          </p>

          {/* Desktop keeps the proof under the copy; on mobile it moves below
              the app peek so the peek crops at the fold as the scroll cue. */}
          <p className="mt-6 hidden max-w-xl border-t border-rule pt-5 text-[13.5px] leading-relaxed text-ink-muted lg:block">
            {proofLine}
          </p>
        </div>

        <AppPeek />

        <p className="text-[13px] leading-relaxed text-ink-muted lg:hidden">{proofLine}</p>
      </div>
    </section>
  )
}

// A slice of a real Charla: a turn, a calm correction, the partner keeping
// the conversation going, a phrase landing in the library. Decorative, so
// hidden from the accessibility tree; the copy to its left says the same.
function AppPeek() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-[400px] lg:max-w-[420px]">
      <div className="max-h-[300px] overflow-hidden [mask-image:linear-gradient(180deg,#000_72%,transparent_100%)] sm:max-h-none sm:overflow-visible sm:[mask-image:none]">
        <div
          className="rounded-[30px] bg-surface p-5 sm:p-6"
          style={{ boxShadow: "inset 0 0 0 1px rgba(30,61,44,.08), 0 3px 0 var(--hb-card-lip)" }}
        >
          <div className="flex items-center justify-between">
            <p className="smallcaps text-ink-faint">Charla · esta tarde</p>
            <span className="flex h-2 w-2 rounded-full bg-green" />
          </div>

          <div className="mt-4 flex justify-end">
            <div
              className="max-w-[85%] rounded-[18px] rounded-br-[6px] bg-green px-4 py-3"
              style={{ boxShadow: "0 3px 0 var(--hb-green-press)" }}
            >
              <p className="font-serif text-[15.5px] leading-snug text-cream">
                Estoy cansada porque el bebé despertó tres veces anoche.
              </p>
            </div>
          </div>

          <div className="mt-2.5 flex items-start gap-2.5 rounded-[16px] bg-terracotta-tint px-4 py-3">
            <div className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-terracotta text-cream">
              <DuoIcon name="check" size={11} detail="#F7F3EC" />
            </div>
            <div>
              <p className="font-serif text-[14.5px] leading-snug text-terracotta-ink">
                Mejor: «el bebé <span className="font-medium">se despertó</span> tres veces»
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-terracotta-ink/80">
                Despertarse is reflexive when someone wakes up.
              </p>
            </div>
          </div>

          <div className="mt-2.5 flex justify-start">
            <div
              className="max-w-[85%] rounded-[18px] rounded-bl-[6px] bg-background px-4 py-3"
              style={{ boxShadow: "inset 0 0 0 1px rgba(30,61,44,.07), 0 2px 0 var(--hb-card-lip)" }}
            >
              <p className="font-serif text-[15.5px] leading-snug text-ink">
                ¡Qué noche! ¿Y pudiste dormir la siesta con él?
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-rule pt-3.5">
            <p className="smallcaps text-ink-faint">Guardada en tus frases</p>
            <div className="mt-2 flex items-center gap-3 rounded-[16px] bg-sunken px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-serif text-[15.5px] leading-snug text-ink">Se despertó con hambre.</p>
                <p className="mt-0.5 text-[12px] text-ink-soft">He woke up hungry.</p>
              </div>
              <span className="rounded-full bg-terracotta-tint px-2 py-1 text-[9px] font-medium uppercase tracking-[.14em] text-terracotta-ink">
                nueva
              </span>
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-sunken-2 text-ink">
                <DuoIcon name="escuchar" size={15} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
