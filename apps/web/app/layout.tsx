import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from 'next-themes'
import { Nunito_Sans } from 'next/font/google'
import '@connnect/ui/globals.css'

const nunitoSans = Nunito_Sans({
  variable: '--font-nunito-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Connnect.app - AI-powered connections management app',
  description: 'AI-powered connections management app that makes database operations smarter. A modern alternative to pgAdmin, DBeaver, etc.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`font-sans ${nunitoSans.variable} antialiased`}
      >
        <ThemeProvider attribute="class">
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
