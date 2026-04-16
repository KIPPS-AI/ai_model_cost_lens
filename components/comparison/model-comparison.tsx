'use client'

import { useState, useMemo } from 'react'
import { Plus, X, Check, Minus } from 'lucide-react'
import { type ModelPricing } from '@/lib/model-data'
import { useModels } from '@/hooks/use-models'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const MAX_SLOTS = 3

const PALETTE = [
  'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50',
  'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50',
  'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/50',
  'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/50',
  'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50',
  'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/50',
  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50',
  'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800/50',
  'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-800/50',
  'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/40 dark:text-slate-400 dark:border-slate-800/50',
]

function providerColor(provider: string): string {
  let hash = 0
  for (let i = 0; i < provider.length; i++) hash = (hash * 31 + provider.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

function formatPrice(price: number) {
  if (price === 0) return '—'
  if (price < 0.01) return `$${price.toFixed(4)}`
  return `$${price.toFixed(2)}`
}

function formatContext(tokens: number) {
  if (tokens === 0) return '—'
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`
  return `${tokens}`
}

type Highlight = 'best' | 'worst' | 'neutral'

interface CompareRow {
  label: string
  category?: string
  render: (m: ModelPricing) => React.ReactNode
  highlight?: (vals: ModelPricing[]) => (m: ModelPricing) => Highlight
}

const ROWS: CompareRow[] = [
  {
    category: 'Overview',
    label: 'Provider',
    render: (m) => (
      <span className={cn('inline-flex rounded border px-2 py-0.5 text-xs font-medium', providerColor(m.provider))}>
        {m.provider}
      </span>
    ),
  },
  {
    label: 'Modality',
    render: (m) => <span className="capitalize text-sm">{m.modality}</span>,
  },
  {
    category: 'Pricing',
    label: 'Input / 1M tokens',
    render: (m) => <span className="font-mono text-sm">{formatPrice(m.inputPricePer1M)}</span>,
    highlight: (vals) => (m) => {
      const prices = vals.map((v) => v.inputPricePer1M)
      if (m.inputPricePer1M === Math.min(...prices)) return 'best'
      if (m.inputPricePer1M === Math.max(...prices)) return 'worst'
      return 'neutral'
    },
  },
  {
    label: 'Output / 1M tokens',
    render: (m) => <span className="font-mono text-sm">{formatPrice(m.outputPricePer1M)}</span>,
    highlight: (vals) => (m) => {
      const prices = vals.map((v) => v.outputPricePer1M)
      if (m.outputPricePer1M === Math.min(...prices)) return 'best'
      if (m.outputPricePer1M === Math.max(...prices)) return 'worst'
      return 'neutral'
    },
  },
  {
    label: 'Cached input / 1M tokens',
    render: (m) => <span className="font-mono text-sm">{m.cachedInputPricePer1M != null ? formatPrice(m.cachedInputPricePer1M) : '—'}</span>,
    highlight: (vals) => (m) => {
      const prices = vals.filter((v) => v.cachedInputPricePer1M != null).map((v) => v.cachedInputPricePer1M as number)
      if (prices.length < 2 || m.cachedInputPricePer1M == null) return 'neutral'
      if (m.cachedInputPricePer1M === Math.min(...prices)) return 'best'
      if (m.cachedInputPricePer1M === Math.max(...prices)) return 'worst'
      return 'neutral'
    },
  },
  {
    category: 'Capabilities',
    label: 'Context length',
    render: (m) => <span className="font-mono text-sm">{formatContext(m.contextLength)}</span>,
    highlight: (vals) => (m) => {
      const ctxs = vals.map((v) => v.contextLength)
      if (m.contextLength === Math.max(...ctxs)) return 'best'
      if (m.contextLength === Math.min(...ctxs)) return 'worst'
      return 'neutral'
    },
  },
  {
    label: 'Function calling',
    render: (m) => m.supportsFunctionCalling
      ? <Check className="h-4 w-4 text-[var(--cost-low)]" />
      : <Minus className="h-4 w-4 text-muted-foreground/40" />,
  },
  {
    label: 'Temperature control',
    render: (m) => m.supportsTemperature
      ? <Check className="h-4 w-4 text-[var(--cost-low)]" />
      : <Minus className="h-4 w-4 text-muted-foreground/40" />,
  },
  {
    label: 'Top-K sampling',
    render: (m) => m.supportsTopK
      ? <Check className="h-4 w-4 text-[var(--cost-low)]" />
      : <Minus className="h-4 w-4 text-muted-foreground/40" />,
  },
  {
    category: 'Voice',
    label: 'STT / minute',
    render: (m) => <span className="font-mono text-sm">{m.sttPricePer1Min != null ? `$${m.sttPricePer1Min.toFixed(4)}` : '—'}</span>,
  },
  {
    label: 'TTS / 1K chars',
    render: (m) => <span className="font-mono text-sm">{m.ttsPricePer1KChars != null ? `$${m.ttsPricePer1KChars.toFixed(3)}` : '—'}</span>,
  },
]

// GROUPED and PROVIDERS are now derived dynamically inside the component from the SWR hook

function cellClass(highlight: Highlight) {
  if (highlight === 'best') return 'text-[var(--cost-low)] font-semibold'
  if (highlight === 'worst') return 'text-[var(--cost-high)]'
  return 'text-foreground'
}

export function ModelComparison() {
  const { models } = useModels()
  const [slots, setSlots] = useState<(ModelPricing | null)[]>([null, null, null])
  const selectedModels = slots.filter(Boolean) as ModelPricing[]

  const GROUPED = useMemo(
    () =>
      models.reduce<Record<string, ModelPricing[]>>((acc, m) => {
        if (!acc[m.provider]) acc[m.provider] = []
        acc[m.provider].push(m)
        return acc
      }, {}),
    [models]
  )
  const PROVIDERS = Object.keys(GROUPED)

  const setSlot = (index: number, id: string | null) => {
    setSlots((prev) => {
      const next = [...prev]
      next[index] = id ? (models.find((m) => m.id === id) ?? null) : null
      return next
    })
  }

  // Group rows by category for section headers
  const rowGroups: { category?: string; rows: CompareRow[] }[] = []
  let currentGroup: { category?: string; rows: CompareRow[] } | null = null
  for (const row of ROWS) {
    if (row.category) {
      currentGroup = { category: row.category, rows: [row] }
      rowGroups.push(currentGroup)
    } else if (currentGroup) {
      currentGroup.rows.push(row)
    } else {
      currentGroup = { rows: [row] }
      rowGroups.push(currentGroup)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Compare Models</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select up to {MAX_SLOTS} models to compare side by side.{' '}
          <span className="text-[var(--cost-low)]">Green</span> = best value,{' '}
          <span className="text-[var(--cost-high)]">red</span> = highest cost.
        </p>
      </div>

      {/* Model selectors */}
      <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-3">
        {slots.map((model, i) => (
          <div key={i} className="space-y-2">
            {/* Selector row */}
            <div className="flex items-center gap-2">
              <Select
                value={model?.id ?? ''}
                onValueChange={(val) => setSlot(i, val || null)}
              >
                <SelectTrigger className="h-9 flex-1 text-sm">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((provider) => (
                    <SelectGroup key={provider}>
                      <SelectLabel className="text-xs">{provider}</SelectLabel>
                      {GROUPED[provider].map((m) => (
                        <SelectItem
                          key={m.id}
                          value={m.id}
                          disabled={slots.some((s, si) => si !== i && s?.id === m.id)}
                          className="text-sm"
                        >
                          {m.displayName}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              {model && (
                <button
                  onClick={() => setSlot(i, null)}
                  aria-label="Remove model"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Model card / empty state */}
            {model ? (
              <div className="rounded-md border border-border bg-card px-4 py-3">
                <span className={cn('inline-flex rounded border px-1.5 py-0.5 text-xs font-medium', providerColor(model.provider))}>
                  {model.provider}
                </span>
                <p className="mt-1.5 text-sm font-semibold text-foreground">{model.displayName}</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">{model.apiName}</p>
              </div>
            ) : (
              <div className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-muted/20 text-muted-foreground">
                <Plus className="h-4 w-4" />
                <span className="text-xs">Add model</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Comparison table */}
      {selectedModels.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="w-44 px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Metric
                  </th>
                  {slots.map((model, i) =>
                    model ? (
                      <th key={i} className="px-5 py-3 text-left text-xs font-medium text-foreground">
                        {model.displayName}
                      </th>
                    ) : null
                  )}
                </tr>
              </thead>
              <tbody>
                {rowGroups.map((group, gi) => (
                  <>
                    {group.category && (
                      <tr key={`cat-${gi}`} className="border-t border-border bg-muted/20">
                        <td
                          colSpan={selectedModels.length + 1}
                          className="px-5 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {group.category}
                        </td>
                      </tr>
                    )}
                    {group.rows.map((row) => (
                      <tr key={row.label} className="border-t border-border transition-colors hover:bg-muted/10">
                        <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {row.label}
                        </td>
                        {slots.map((model, i) => {
                          if (!model) return null
                          const hl = row.highlight ? row.highlight(selectedModels)(model) : 'neutral'
                          return (
                            <td key={i} className={cn('px-5 py-3', cellClass(hl))}>
                              {row.render(model)}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-20 text-center">
          <p className="text-sm font-medium text-foreground">No models selected</p>
          <p className="text-xs text-muted-foreground">
            Choose up to {MAX_SLOTS} models from the dropdowns above to compare them.
          </p>
        </div>
      )}
    </div>
  )
}
