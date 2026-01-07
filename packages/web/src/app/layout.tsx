import type { Metadata } from 'next'
import { Providers } from './providers'
import { Header } from '@/components/Header'
import './globals.css'

export const metadata: Metadata = {
  title: 'Oneshot',
  description: 'Showcase verified AI code transformations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
