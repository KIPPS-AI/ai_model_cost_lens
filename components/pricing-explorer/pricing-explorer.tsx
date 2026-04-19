'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  type Modality,
  type ModelPricing,
} from '@/lib/model-data'
import { useModels } from '@/hooks/use-models'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  Search,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  SlidersHorizontal,
  X,
  Info,
} from 'lucide-react'

type SortKey = 'displayName' | 'inputPricePer1M' | 'outputPricePer1M' | 'contextLength'
type SortDir = 'asc' | 'desc'

// Modalities in preferred display order
const MODALITY_ORDER: Modality[] = ['text', 'multimodal', 'audio', 'image', 'video']

// Deterministic provider badge color derived from the provider name string.
// This means any new provider added to the data automatically gets a color.
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
  'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-800/50',
  'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/50',
  'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800/50',
  'bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-950/40 dark:text-lime-400 dark:border-lime-800/50',
]

function providerColor(provider: string): string {
  let hash = 0
  for (let i = 0; i < provider.length; i++) {
    hash = (hash * 31 + provider.charCodeAt(i)) >>> 0
  }
  return PALETTE[hash % PALETTE.length]
}

function formatContext(n: number) {
  if (n === 0) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toString()
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [text])
  return (
    <button
      onClick={copy}
      aria-label={`Copy ${text}`}
      className="rounded p-1 text-muted-foreground/60 transition-colors hover:bg-secondary hover:text-foreground"
    >
      {copied ? <Check className="h-3 w-3 text-[var(--cost-low)]" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

function SortIcon({ col, current, dir }: { col: SortKey; current: SortKey; dir: SortDir }) {
  if (col !== current) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40" />
  return dir === 'asc'
    ? <ChevronUp className="ml-1 h-3 w-3" />
    : <ChevronDown className="ml-1 h-3 w-3" />
}


const PAGE_SIZE = 12

const UNIT_PRICE_DESCRIPTIONS = [
  { modality: 'Text / Multimodal', unit: 'per 1M input tokens', example: 'e.g. $0.15 / 1M tokens' },
  { modality: 'Audio (STT)',       unit: 'per minute of audio',  example: 'e.g. $0.006 / min' },
  { modality: 'Image Generation',  unit: 'per image generated',  example: 'e.g. $0.040 / image' },
  { modality: 'Video Generation',  unit: 'per second of video',  example: 'e.g. $0.050 / sec' },
]

function UnitPriceTooltip() {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label="Unit price explanation"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="ml-1.5 rounded text-muted-foreground/60 hover:text-muted-foreground focus:outline-none"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-popover p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold text-foreground">Unit price varies by modality</p>
          <div className="space-y-2">
            {UNIT_PRICE_DESCRIPTIONS.map(({ modality, unit, example }) => (
              <div key={modality} className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-foreground">{modality}</span>
                <span className="text-xs text-muted-foreground">
                  {unit} <span className="text-muted-foreground/60">&mdash; {example}</span>
                </span>
              </div>
            ))}
          </div>
          {/* caret */}
          <div className="absolute -top-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-l border-t border-border bg-popover" />
        </div>
      )}
    </span>
  )
}

function FilterSection({
  title,
  defaultOpen = true,
  activeCount,
  children,
}: {
  title: string
  defaultOpen?: boolean
  activeCount?: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          {title}
          {activeCount != null && activeCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  )
}

export function PricingExplorer() {
  const { models, total, isLoading } = useModels()
  const [search, setSearch] = useState('')
  const [selectedModalities, setSelectedModalities] = useState<string[]>([])
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [filterTemp, setFilterTemp] = useState(false)
  const [filterTopK, setFilterTopK] = useState(false)
  const [filterFn, setFilterFn] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('inputPricePer1M')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(0)

  // Derive filter options directly from loaded model data — adapts automatically
  const availableProviders = useMemo(
    () => [...new Set(models.map((m) => m.provider))].sort(),
    [models]
  )
  const availableModalities = useMemo(
    () => MODALITY_ORDER.filter((mod) => models.some((m) => m.modality === mod)),
    [models]
  )

  const toggleModality = (m: string) =>
    setSelectedModalities((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    )
  const toggleProvider = (p: string) =>
    setSelectedProviders((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )

  const handleSort = (key: SortKey) => {
    setSortDir(key === sortKey ? (d) => (d === 'asc' ? 'desc' : 'asc') : 'asc')
    setSortKey(key)
    setPage(0)
  }

  const hasActiveFilters =
    search || selectedModalities.length > 0 || selectedProviders.length > 0 || filterTemp || filterTopK || filterFn

  const clearFilters = () => {
    setSearch('')
    setSelectedModalities([])
    setSelectedProviders([])
    setFilterTemp(false)
    setFilterTopK(false)
    setFilterFn(false)
    setPage(0)
  }

  const filtered = useMemo(() => {
    let data = models
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(
        (m) =>
          m.displayName.toLowerCase().includes(q) ||
          m.apiName.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q)
      )
    }
    if (selectedModalities.length > 0) data = data.filter((m) => selectedModalities.includes(m.modality))
    if (selectedProviders.length > 0) data = data.filter((m) => selectedProviders.includes(m.provider))
    if (filterTemp) data = data.filter((m) => m.supportsTemperature)
    if (filterTopK) data = data.filter((m) => m.supportsTopK)
    if (filterFn) data = data.filter((m) => m.supportsFunctionCalling)

    return [...data].sort((a, b) => {
      const aVal = a[sortKey] ?? 0
      const bVal = b[sortKey] ?? 0
      const cmp =
        typeof aVal === 'string'
          ? aVal.localeCompare(bVal as string)
          : (aVal as number) - (bVal as number)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [search, selectedModalities, selectedProviders, filterTemp, filterTopK, filterFn, sortKey, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  function ThCell({ label, sk, className }: { label: string; sk?: SortKey; className?: string }) {
    return (
      <th
        className={cn(
          'px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground',
          sk && 'cursor-pointer select-none hover:text-foreground',
          className
        )}
        onClick={sk ? () => handleSort(sk) : undefined}
      >
        <span className="flex items-center">
          {label}
          {sk && <SortIcon col={sk} current={sortKey} dir={sortDir} />}
        </span>
      </th>
    )
  }

  return (
    <section id="pricing">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Model Pricing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} models across {availableProviders.length} providers — click column headers to sort.
        </p>
      </div>

      <div className="flex gap-6 items-start">
        {/* ── Sticky left filter sidebar ─────────────────────────── */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-20 rounded-lg border border-border bg-card">
            {/* sidebar header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>

            <div className="divide-y divide-border">
              {/* Search */}
              <div className="p-4">
                <FilterSection title="Search" activeCount={search ? 1 : 0}>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Models, providers…"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(0) }}
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                </FilterSection>
              </div>

              {/* Modality */}
              <div className="p-4">
                <FilterSection title="Modality" activeCount={selectedModalities.length}>
                  <div className="space-y-1">
                    {availableModalities.map((m) => {
                      const active = selectedModalities.includes(m)
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => { toggleModality(m); setPage(0) }}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors capitalize',
                            active
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          <span className={cn(
                            'h-1.5 w-1.5 shrink-0 rounded-full',
                            active ? 'bg-primary-foreground' : 'bg-border'
                          )} />
                          {m}
                        </button>
                      )
                    })}
                  </div>
                </FilterSection>
              </div>

              {/* Provider */}
              <div className="p-4">
                <FilterSection title="Provider" activeCount={selectedProviders.length}>
                  <div className="space-y-1">
                    {availableProviders.map((p) => {
                      const active = selectedProviders.includes(p)
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => { toggleProvider(p); setPage(0) }}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors',
                            active
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          <span className={cn(
                            'h-1.5 w-1.5 shrink-0 rounded-full',
                            active ? 'bg-primary-foreground' : 'bg-border'
                          )} />
                          {p}
                        </button>
                      )
                    })}
                  </div>
                </FilterSection>
              </div>

              {/* Capabilities */}
              <div className="p-4">
                <FilterSection
                  title="Capabilities"
                  activeCount={[filterTemp, filterTopK, filterFn].filter(Boolean).length}
                >
                  <div className="space-y-1">
                    {([
                      { label: 'Temperature', state: filterTemp, toggle: () => { setFilterTemp((v) => !v); setPage(0) } },
                      { label: 'Top-K', state: filterTopK, toggle: () => { setFilterTopK((v) => !v); setPage(0) } },
                      { label: 'Function Calling', state: filterFn, toggle: () => { setFilterFn((v) => !v); setPage(0) } },
                    ] as const).map(({ label, state, toggle }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={toggle}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors',
                          state
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <span className={cn(
                          'h-1.5 w-1.5 shrink-0 rounded-full',
                          state ? 'bg-primary-foreground' : 'bg-border'
                        )} />
                        {label}
                      </button>
                    ))}
                  </div>
                </FilterSection>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main content: search (mobile) + table ──────────────── */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Mobile search + filter chip (visible below lg) */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search models…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0) }}
                className="h-8 pl-8 text-sm"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filtered.length}</span> of {total} models
            </p>
            {totalPages > 1 && (
              <p className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</p>
            )}
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="divide-y divide-border">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3.5 w-16" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <ThCell label="Model" sk="displayName" />
                      <th
                    className="cursor-pointer select-none px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
                    onClick={() => handleSort('inputPricePer1M')}
                  >
                    <span className="flex items-center">
                      Input / Unit Price
                      <SortIcon col="inputPricePer1M" current={sortKey} dir={sortDir} />
                      <UnitPriceTooltip />
                    </span>
                  </th>
                      <ThCell label="Output / Resolution" sk="outputPricePer1M" />
                      <ThCell label="Context" sk="contextLength" />
                      <ThCell label="Cached / 1M" className="hidden md:table-cell" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-16 text-center text-sm text-muted-foreground">
                          No models match your filters.
                        </td>
                      </tr>
                    ) : (
                      paginated.map((model) => (
                        <ModelRow key={model.id} model={model} />
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = totalPages <= 5 ? i : Math.max(0, Math.min(page - 2, totalPages - 5)) + i
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-8 text-xs"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum + 1}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function ModelRow({ model }: { model: ModelPricing }) {
  return (
    <tr className="group transition-colors hover:bg-muted/20">
      {/* Model name */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <Link
              href={`/models/${model.id}`}
              className="font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
            >
              {model.displayName}
            </Link>
            <CopyButton text={model.apiName} />
          </div>
          <span
            className={cn(
              'w-fit rounded border px-1.5 py-0.5 text-xs font-medium',
              providerColor(model.provider)
            )}
          >
            {model.provider}
          </span>
        </div>
      </td>

      {/* Input price / unit pricing */}
      <td className="px-4 py-3">
        {model.modality === 'image' && model.imagePricePerImage != null ? (
          <div>
            <span className="font-mono text-sm font-medium text-foreground">
              ${model.imagePricePerImage.toFixed(3)}
            </span>
            <p className="text-xs text-muted-foreground">per image</p>
          </div>
        ) : model.modality === 'video' && model.videoPricePerSecond != null ? (
          <div>
            <span className="font-mono text-sm font-medium text-foreground">
              ${model.videoPricePerSecond.toFixed(3)}
            </span>
            <p className="text-xs text-muted-foreground">per second</p>
          </div>
        ) : model.inputPricePer1M > 0 ? (
          <span className="font-mono text-sm font-medium text-foreground">
            ${model.inputPricePer1M.toFixed(model.inputPricePer1M < 1 ? 3 : 2)}
          </span>
        ) : model.sttPricePer1Min ? (
          <div>
            <span className="font-mono text-sm font-medium text-foreground">
              ${model.sttPricePer1Min}
            </span>
            <p className="text-xs text-muted-foreground">per min</p>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>

      {/* Output price */}
      <td className="px-4 py-3">
        {model.modality === 'image' || model.modality === 'video' ? (
          <span className="text-xs text-muted-foreground">
            {model.imageResolution ?? model.videoResolution ?? '—'}
          </span>
        ) : model.outputPricePer1M > 0 ? (
          <span className="font-mono text-sm font-medium text-foreground">
            ${model.outputPricePer1M.toFixed(model.outputPricePer1M < 1 ? 3 : 2)}
          </span>
        ) : model.ttsPricePer1KChars ? (
          <div>
            <span className="font-mono text-sm font-medium text-foreground">
              ${model.ttsPricePer1KChars}
            </span>
            <p className="text-xs text-muted-foreground">per 1K chars</p>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>

      {/* Context */}
      <td className="px-4 py-3">
        <span className="font-mono text-sm text-muted-foreground">
          {formatContext(model.contextLength)}
        </span>
      </td>

      {/* Cached price */}
      <td className="hidden px-4 py-3 md:table-cell">
        {model.cachedInputPricePer1M != null ? (
          <span className="font-mono text-sm text-[var(--cost-low)]">
            ${model.cachedInputPricePer1M.toFixed(model.cachedInputPricePer1M < 1 ? 3 : 2)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>

    </tr>
  )
}
