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
    <section className="mx-auto flex max-w-3xl flex-col items-center px-5 pt-16 pb-12 text-center sm:pt-24 sm:pb-20">
      {eyebrow && (
        <p className="mb-5 inline-flex rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {eyebrow}
        </p>
      )}
      <h1 className="font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
        {headline}
      </h1>
      <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">{subhead}</p>
      <div className="mt-8 flex w-full flex-col items-center gap-3">
        <WaitlistForm audience={audience} placement="hero" />
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>or</span>
          <CtaTry audience={audience} placement="hero" variant="ghost">
            Try it free →
          </CtaTry>
        </div>
      </div>
    </section>
  )
}
