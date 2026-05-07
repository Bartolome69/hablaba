import type { Metadata, Viewport } from 'next'
import { DM_Sans, Fraunces } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { PostHogProvider } from '@/components/posthog-provider'
import { PwaRegister } from '@/components/pwa-register'
import { InstallPrompt } from '@/components/install-prompt'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: '--font-dm-sans'
})

const fraunces = Fraunces({ 
  subsets: ["latin"],
  variable: '--font-fraunces'
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://spanishroutine.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Hablaba — Speak Spanish with your little one',
    template: '%s · Hablaba',
  },
  description: 'Hablaba helps parents raise bilingual kids and B1 learners practice real conversation. Warm, calm, encouraging — Spanish for daily life.',
  applicationName: 'Hablaba',
  keywords: ['spanish for parents', 'bilingual parenting', 'spanish practice', 'b1 spanish', 'spanish ai tutor', 'learn spanish'],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Hablaba — Speak Spanish with your little one',
    description: 'Raise a bilingual kid. Practice your Spanish. Warm, calm, encouraging.',
    siteName: 'Hablaba',
    type: 'website',
    url: SITE_URL,
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hablaba — Speak Spanish with your little one',
    description: 'Raise a bilingual kid. Practice your Spanish. Warm, calm, encouraging.',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#f5efe6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${fraunces.variable} font-sans antialiased`}>
        <PostHogProvider>{children}</PostHogProvider>
        <PwaRegister />
        <InstallPrompt />
        <Toaster position="top-center" />
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Hablaba',
              url: SITE_URL,
              logo: `${SITE_URL}/icon-light-32x32.png`,
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Hablaba',
              url: SITE_URL,
            }),
          }}
        />
      </body>
    </html>
  )
}
