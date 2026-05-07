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
    <section className="bg-secondary/40 border-y border-border">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <h2 className="mb-10 text-center font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          {heading}
        </h2>
        <ol className="grid gap-6 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl bg-background p-6 shadow-sm">
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {i + 1}
              </div>
              <h3 className="font-serif text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
