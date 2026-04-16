import { Header } from '@/components/header'
import { PricingExplorer } from '@/components/pricing-explorer/pricing-explorer'
import { SiteFooter } from '@/components/site-footer'

export const metadata = {
  title: 'Model Pricing — CostLens',
  description:
    'Compare token pricing, context windows, and capabilities across 24+ AI models from OpenAI, Anthropic, Google, Meta, Mistral, and Cohere.',
}

export default function ModelsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PricingExplorer />
      </main>
      <SiteFooter />
    </div>
  )
}
