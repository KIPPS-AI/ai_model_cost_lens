'use client'

import { type CostBreakdown } from '@/lib/cost-calculator'
import { type CalculatorConfig } from '@/lib/model-data'
import { formatCost, formatTokens, getCostLevel } from '@/lib/cost-calculator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { TrendingDown } from 'lucide-react'

interface Props {
  breakdown: CostBreakdown
  config: CalculatorConfig
  onMonthlyUsersChange: (v: number) => void
}

function CostBar({ distribution }: { distribution: CostBreakdown['distribution'] }) {
  const total = distribution.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null
  return (
    <div className="space-y-2.5">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-secondary">
        {distribution.map((d, i) => (
          <div
            key={i}
            className={cn('transition-all', d.color)}
            style={{ width: `${(d.value / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {distribution.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={cn('h-2 w-2 rounded-full', d.color)} />
            <span className="text-xs text-muted-foreground">
              {d.label} <span className="tabular-nums">({((d.value / total) * 100).toFixed(0)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TokenLine({ label, tokens, cost, savings }: { label: string; tokens?: number; cost: number; savings?: number }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <div>
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          {tokens !== undefined && `${formatTokens(tokens)} tokens`}
          {savings && savings > 0 && (
            <span className="ml-1.5 text-[var(--cost-low)]">−{formatCost(savings)} cached</span>
          )}
        </p>
      </div>
      <span className="shrink-0 font-mono text-sm font-medium tabular-nums text-foreground">
        {formatCost(cost)}
      </span>
    </div>
  )
}

export function CostBreakdownPanel({ breakdown, config, onMonthlyUsersChange }: Props) {
  const hasLLM = config.aiComponents.includes('llm')
  const hasSTT = config.aiComponents.includes('stt')
  const hasTTS = config.aiComponents.includes('tts')

  const totalLevel = getCostLevel(breakdown.totalCostPerConversation)
  const costAccentClass =
    totalLevel === 'low'
      ? 'text-[var(--cost-low)]'
      : totalLevel === 'medium'
      ? 'text-[var(--cost-medium)]'
      : 'text-[var(--cost-high)]'

  return (
    <div className="space-y-5">
      {/* Distribution bar */}
      {breakdown.distribution.length > 0 && (
        <CostBar distribution={breakdown.distribution} />
      )}

      {/* Line items */}
      {(hasLLM || hasSTT || hasTTS) && (
        <div className="divide-y divide-border rounded-md border border-border">
          {hasLLM && (
            <div className="px-4">
              <p className="pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">LLM</p>
              <TokenLine
                label="Input tokens"
                tokens={breakdown.inputTokens}
                cost={breakdown.inputTokensCost}
                savings={breakdown.cachedTokensSavings}
              />
              <TokenLine
                label="Output tokens"
                tokens={breakdown.outputTokens}
                cost={breakdown.outputTokensCost}
              />
              {breakdown.reasoningTokens > 0 && (
                <TokenLine
                  label="Reasoning tokens"
                  tokens={breakdown.reasoningTokens}
                  cost={breakdown.reasoningTokensCost}
                />
              )}
            </div>
          )}

          {(hasSTT || hasTTS) && (breakdown.sttCost > 0 || breakdown.ttsCost > 0) && (
            <div className="px-4">
              <p className="pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Voice</p>
              {breakdown.sttCost > 0 && (
                <TokenLine label="Speech-to-Text" cost={breakdown.sttCost} />
              )}
              {breakdown.ttsCost > 0 && (
                <TokenLine label="Text-to-Speech" cost={breakdown.ttsCost} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-border bg-[var(--surface)] px-4 py-3">
          <p className="text-xs text-muted-foreground">Per Conversation</p>
          <p className={cn('mt-1 text-xl font-semibold tabular-nums', costAccentClass)}>
            {formatCost(breakdown.totalCostPerConversation)}
          </p>
        </div>
        <div className="rounded-md border border-border bg-[var(--surface)] px-4 py-3">
          <p className="text-xs text-muted-foreground">Per 1K Conversations</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
            {formatCost(breakdown.totalCostPer1k)}
          </p>
        </div>
      </div>

      {/* Monthly estimate */}
      <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Monthly Estimate</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {formatCost(breakdown.monthlyCost)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {(isFinite(config.monthlyUsers) ? config.monthlyUsers : 0).toLocaleString()} × {formatCost(breakdown.totalCostPerConversation)}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <Label htmlFor="monthly-users" className="text-xs text-muted-foreground">
              Monthly Usage
            </Label>
            <Input
              id="monthly-users"
              type="number"
              min={1}
              value={config.monthlyUsers}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10)
                onMonthlyUsersChange(isFinite(n) && n > 0 ? n : 1)
              }}
              className="h-8 w-28 text-right text-sm"
            />
          </div>
        </div>
      </div>

      {/* Caching savings */}
      {breakdown.cachedTokensSavings > 0 && (
        <div className="flex items-start gap-2.5 rounded-md border border-border bg-[var(--surface)] px-4 py-3">
          <TrendingDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--cost-low)]" />
          <p className="text-xs text-muted-foreground">
            Prompt caching saves{' '}
            <span className="font-medium text-foreground">{formatCost(breakdown.cachedTokensSavings)}</span>
            {' '}per conversation —{' '}
            <span className="font-medium text-foreground">
              {formatCost(breakdown.cachedTokensSavings * config.monthlyUsers)}
            </span>
            {' '}per month
          </p>
        </div>
      )}
    </div>
  )
}
