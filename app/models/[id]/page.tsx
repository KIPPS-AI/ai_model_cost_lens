'use client'

import { use } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { ArrowLeft, Check, Minus, Copy, CheckCheck, ExternalLink } from 'lucide-react'
import { type ModelPricing, type Provider } from '@/lib/model-data'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/header'
import { SiteFooter } from '@/components/site-footer'
import { cn } from '@/lib/utils'
import { useState, useCallback } from 'react'

const PROVIDER_COLORS: Record<Provider, string> = {
  OpenAI:    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50',
  Anthropic: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/50',
  Google:    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50',
  Meta:      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/50',
  Mistral:   'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50',
  Cohere:    'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/50',
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatContext(n: number) {
  if (n === 0) return 'N/A'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M tokens`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K tokens`
  return `${n} tokens`
}

function formatPrice(n: number, decimals = 2) {
  if (n === 0) return '—'
  return `$${n.toFixed(n < 1 ? 4 : decimals)}`
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }, [text])
  return (
    <button
      onClick={copy}
      aria-label={`Copy ${text}`}
      className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs font-mono text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
    >
      {copied ? <CheckCheck className="h-3 w-3 text-[var(--cost-low)]" /> : <Copy className="h-3 w-3" />}
      {text}
    </button>
  )
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('mt-2 text-2xl font-semibold tabular-nums', accent ? 'text-primary' : 'text-foreground')}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function CapRow({ label, active, description }: { label: string; active: boolean; description?: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className={cn(
        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
        active ? 'bg-[var(--cost-low)]/15 text-[var(--cost-low)]' : 'bg-muted text-muted-foreground/40'
      )}>
        {active ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      </span>
      <div>
        <p className={cn('text-sm font-medium', active ? 'text-foreground' : 'text-muted-foreground')}>
          {label}
        </p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}

function ModelDetailView({ model }: { model: ModelPricing }) {
  const isTextLLM = model.modality !== 'audio' || (!model.sttPricePer1Min && !model.ttsPricePer1KChars)

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/models"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Model Pricing
      </Link>

      {/* Hero */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded border px-2 py-0.5 text-xs font-medium', PROVIDER_COLORS[model.provider])}>
              {model.provider}
            </span>
            <span className="rounded border border-border bg-secondary px-2 py-0.5 text-xs text-muted-foreground capitalize">
              {model.modality}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{model.displayName}</h1>
          <CopyButton text={model.apiName} />
        </div>
        <Link
          href={`/?modelId=${model.id}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open in Calculator
        </Link>
      </div>

      {/* Pricing cards */}
      {isTextLLM && (
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pricing</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Input" value={formatPrice(model.inputPricePer1M)} sub="per 1M tokens" />
            <StatCard label="Output" value={formatPrice(model.outputPricePer1M)} sub="per 1M tokens" />
            {model.cachedInputPricePer1M != null && (
              <StatCard
                label="Cached Input"
                value={formatPrice(model.cachedInputPricePer1M)}
                sub="per 1M tokens"
                accent
              />
            )}
            <StatCard label="Context Window" value={formatContext(model.contextLength)} />
          </div>
        </div>
      )}

      {/* Audio pricing */}
      {(model.sttPricePer1Min || model.ttsPricePer1KChars) && (
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Voice Pricing</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {model.sttPricePer1Min != null && (
              <StatCard label="Speech-to-Text" value={`$${model.sttPricePer1Min.toFixed(4)}`} sub="per minute" />
            )}
            {model.ttsPricePer1KChars != null && (
              <StatCard label="Text-to-Speech" value={`$${model.ttsPricePer1KChars.toFixed(3)}`} sub="per 1K characters" />
            )}
          </div>
        </div>
      )}

      {/* Capabilities */}
      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Capabilities</h2>
        <div className="divide-y divide-border rounded-lg border border-border bg-card px-5">
          <CapRow
            label="Function Calling"
            active={model.supportsFunctionCalling}
            description="Supports structured tool / function calls"
          />
          <CapRow
            label="Temperature Control"
            active={model.supportsTemperature}
            description="Supports adjusting response randomness via temperature"
          />
          <CapRow
            label="Top-K Sampling"
            active={model.supportsTopK}
            description="Supports limiting token selection to the top K candidates"
          />
          <CapRow
            label="Prompt Caching"
            active={model.cachedInputPricePer1M != null}
            description={
              model.cachedInputPricePer1M != null
                ? `Cached tokens billed at ${formatPrice(model.cachedInputPricePer1M)} per 1M — ${Math.round((1 - model.cachedInputPricePer1M / model.inputPricePer1M) * 100)}% cheaper than standard input`
                : 'Prompt caching not available for this model'
            }
          />
          <CapRow
            label="Multimodal Input"
            active={model.modality === 'multimodal'}
            description="Accepts image, audio, or other non-text inputs"
          />
        </div>
      </div>

      {/* Pricing note */}
      <p className="text-xs text-muted-foreground">
        Pricing sourced from official provider documentation and may change. Always verify on the provider&apos;s pricing page before budgeting.
      </p>
    </div>
  )
}

function ModelDetailSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-5 w-32" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-7 w-48" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5 space-y-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ModelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data, error, isLoading } = useSWR<{ data: ModelPricing }>(
    `/api/models/${id}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {isLoading && <ModelDetailSkeleton />}
        {error && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-sm font-medium text-foreground">Model not found</p>
            <Link href="/models" className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
              Back to Model Pricing
            </Link>
          </div>
        )}
        {data?.data && <ModelDetailView model={data.data} />}
      </main>
      <SiteFooter />
    </div>
  )
}
