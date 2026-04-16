import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'CostLens',
  description: 'Estimate the cost of running AI-powered tasks — voice calls, chatbots, CRM automation, and more. Compare model pricing across OpenAI, Anthropic, and Google.',
  generator: 'v0.app',
  keywords: ['CostLens', 'AI cost', 'LLM pricing', 'token calculator', 'AI budget', 'GPT cost', 'Claude pricing'],
  icons: {
    icon: '/kipps-logo.png',
    apple: '/kipps-logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
