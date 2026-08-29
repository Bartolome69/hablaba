interface Step {
  title: string
  body: string
}

interface HowItWorksProps {
  heading?: string
  steps: Step[]
}

export function HowItWorks({ heading = "How it works", steps }: HowItWorksProps) {
  return (
    <section className="border-y border-rule bg-sunken/50">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <h2 className="mb-10 text-center font-serif text-[32px] tracking-[-0.02em] text-ink sm:text-[40px]">
          {heading}
        </h2>
        <ol className="grid gap-5 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="clay-static rounded-[22px] p-6">
              <div
                className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-green font-serif text-lg text-cream"
                style={{ boxShadow: "0 3px 0 var(--hb-green-press)" }}
              >
                {i + 1}
              </div>
              <h3 className="font-serif text-[20px] tracking-[-0.01em] text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
