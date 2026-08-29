import { CtaTry } from "@/components/marketing/cta-try"
import { WaitlistForm } from "@/components/marketing/waitlist-form"

interface HeroProps {
  eyebrow?: string
  headline: string
  subhead: string
  audience?: string
}

export function Hero({ eyebrow, headline, subhead, audience }: HeroProps) {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-14 pt-16 text-center sm:pb-20 sm:pt-24">
      {eyebrow && (
        <p className="mb-6 inline-flex rounded-full bg-terracotta-tint px-4 py-1.5 text-[11px] font-medium uppercase tracking-[.16em] text-terracotta-ink">
          {eyebrow}
        </p>
      )}
      <h1 className="font-serif text-[44px] leading-[1.02] tracking-[-0.03em] text-ink text-balance sm:text-[64px]">
        {headline}
      </h1>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">{subhead}</p>
      <div className="mt-9 flex w-full flex-col items-center gap-3.5">
        <WaitlistForm audience={audience} placement="hero" />
        <div className="flex items-center gap-1 text-sm text-ink-soft">
          <span>or</span>
          <CtaTry audience={audience} placement="hero" variant="ghost">
            try it free now →
          </CtaTry>
        </div>
      </div>
    </section>
  )
}
