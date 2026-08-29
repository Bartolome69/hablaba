import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export interface FaqItem {
  q: string
  a: string
}

interface FaqProps {
  heading?: string
  items: FaqItem[]
}

export function Faq({ heading = "Questions", items }: FaqProps) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <h2 className="mb-8 text-center font-serif text-[32px] tracking-[-0.02em] text-ink sm:text-[40px]">
        {heading}
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border-rule">
            <AccordionTrigger className="text-left font-serif text-[17px] text-ink hover:no-underline">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-ink-muted">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items.map((i) => ({
              "@type": "Question",
              name: i.q,
              acceptedAnswer: { "@type": "Answer", text: i.a },
            })),
          }),
        }}
      />
    </section>
  )
}
