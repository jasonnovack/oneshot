import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Providers } from './providers'
import { Header } from '@/components/Header'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://oneshot-web.vercel.app'

export const metadata: Metadata = {
  title: {
    default: 'Oneshot - Verified AI Code Transformations',
    template: '%s | Oneshot',
  },
  description: 'Showcase and discover verified AI-powered code transformations. Learn from real prompts, see actual diffs, and reproduce impressive results.',
  keywords: ['AI', 'code', 'Claude', 'GPT', 'coding assistant', 'code generation', 'prompt engineering', 'Claude Code', 'Cursor', 'AI coding'],
  authors: [{ name: 'Oneshot' }],
  creator: 'Oneshot',
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Oneshot',
    title: 'Oneshot - Verified AI Code Transformations',
    description: 'Showcase and discover verified AI-powered code transformations. Learn from real prompts, see actual diffs, and reproduce impressive results.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Oneshot - Verified AI Code Transformations',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Oneshot - Verified AI Code Transformations',
    description: 'Showcase and discover verified AI-powered code transformations.',
    images: ['/og-image.png'],
    creator: '@oneshot',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
