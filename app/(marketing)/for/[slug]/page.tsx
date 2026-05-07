import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Hero } from "@/components/marketing/hero"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { FeatureGrid } from "@/components/marketing/feature-grid"
import { Faq } from "@/components/marketing/faq"
import { audiences, audienceSlugs } from "@/lib/marketing/audiences"

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return audienceSlugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const audience = audiences[slug]
  if (!audience) return {}
  return {
    title: audience.metaTitle,
    description: audience.metaDescription,
    keywords: [audience.keyword],
    alternates: { canonical: `/for/${audience.slug}` },
    openGraph: {
      title: audience.metaTitle,
      description: audience.metaDescription,
      url: `/for/${audience.slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: audience.metaTitle,
      description: audience.metaDescription,
    },
  }
}

export default async function AudiencePage({ params }: PageProps) {
  const { slug } = await params
  const audience = audiences[slug]
  if (!audience) notFound()

  return (
    <>
      <Hero
        eyebrow={audience.eyebrow}
        headline={audience.headline}
        subhead={audience.subhead}
        audience={audience.slug}
      />
      <HowItWorks steps={audience.steps} />
      <FeatureGrid features={audience.features} />
      <Faq items={audience.faq} />
    </>
  )
}
