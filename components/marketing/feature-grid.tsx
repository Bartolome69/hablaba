interface Feature {
  title: string
  body: string
  emoji?: string
}

interface FeatureGridProps {
  heading?: string
  features: Feature[]
}

export function FeatureGrid({ heading, features }: FeatureGridProps) {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
      {heading && (
        <h2 className="mb-10 text-center font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          {heading}
        </h2>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
            {f.emoji && <div className="mb-3 text-2xl">{f.emoji}</div>}
            <h3 className="font-serif text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
