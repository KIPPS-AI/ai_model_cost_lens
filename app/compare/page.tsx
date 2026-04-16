import { Header } from '@/components/header'
import { ModelComparison } from '@/components/comparison/model-comparison'
import { SiteFooter } from '@/components/site-footer'

export const metadata = {
  title: 'Compare Models — CostLens',
  description:
    'Compare AI models side by side by pricing, context window, capabilities and more. Find the best model for your use case.',
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <ModelComparison />
      </main>
      <SiteFooter />
    </div>
  )
}
