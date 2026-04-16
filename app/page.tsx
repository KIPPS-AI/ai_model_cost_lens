import { Header } from '@/components/header'
import { DisclaimerBanner } from '@/components/disclaimer-banner'
import { CalculatorSection } from '@/components/calculator/calculator-section'
import { SiteFooter } from '@/components/site-footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <DisclaimerBanner />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CalculatorSection />
      </main>
      <SiteFooter />
    </div>
  )
}
