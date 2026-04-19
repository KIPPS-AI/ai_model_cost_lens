/**
 * lib/calculators/shared.ts
 *
 * Shared types, utilities, and the CostBreakdown interface used by every
 * per-task calculator. Import from here rather than from cost-calculator.ts
 * when building new task-specific files.
 */

import { type ModelPricing, type CalculatorConfig } from '../model-data'

// Re-export for convenience so callers only need one import
export type { ModelPricing, CalculatorConfig }

// ── CostBreakdown ─────────────────────────────────────────────────────────────

export interface CostBreakdown {
  // Token counts (0 for non-LLM tasks)
  inputTokens: number
  outputTokens: number
  reasoningTokens: number
  cachedTokens: number

  // LLM costs
  inputTokensCost: number
  outputTokensCost: number
  reasoningTokensCost: number
  cachedTokensSavings: number

  // Voice costs
  sttCost: number
  ttsCost: number

  // Image / video costs
  imageCost: number
  videoCost: number

  // Totals
  totalCostPerConversation: number
  totalCostPer1k: number
  monthlyCost: number

  // Distribution (for bar/pie charts)
  distribution: {
    label: string
    value: number
    color: string
  }[]
}

// ── Zero-value baseline ───────────────────────────────────────────────────────

export const EMPTY_BREAKDOWN: CostBreakdown = {
  inputTokens: 0,
  outputTokens: 0,
  reasoningTokens: 0,
  cachedTokens: 0,
  inputTokensCost: 0,
  outputTokensCost: 0,
  reasoningTokensCost: 0,
  cachedTokensSavings: 0,
  sttCost: 0,
  ttsCost: 0,
  imageCost: 0,
  videoCost: 0,
  totalCostPerConversation: 0,
  totalCostPer1k: 0,
  monthlyCost: 0,
  distribution: [],
}

// ── Utility: safe numeric coercion ────────────────────────────────────────────

/**
 * Coerce `v` to a finite number.
 * Returns `fallback` (default 0) for NaN, Infinity, null, or undefined.
 */
export function safe(v: number | undefined | null, fallback = 0): number {
  const n = Number(v)
  return isFinite(n) ? n : fallback
}

// ── Utility: compute totals and monthly cost ──────────────────────────────────

/**
 * Given the individual cost components, compute the per-conversation total,
 * the per-1 000-conversation cost, and the monthly cost.
 */
export function buildTotals(
  parts: {
    inputTokensCost: number
    outputTokensCost: number
    reasoningTokensCost: number
    sttCost: number
    ttsCost: number
    imageCost: number
    videoCost: number
  },
  monthlyUsers: number,
): { totalCostPerConversation: number; totalCostPer1k: number; monthlyCost: number } {
  const totalCostPerConversation =
    parts.inputTokensCost +
    parts.outputTokensCost +
    parts.reasoningTokensCost +
    parts.sttCost +
    parts.ttsCost +
    parts.imageCost +
    parts.videoCost

  return {
    totalCostPerConversation,
    totalCostPer1k: totalCostPerConversation * 1_000,
    monthlyCost: totalCostPerConversation * Math.max(0, safe(monthlyUsers, 1_000)),
  }
}

// ── Utility: build distribution array ────────────────────────────────────────

export function buildDistribution(parts: {
  inputTokensCost: number
  outputTokensCost: number
  reasoningTokensCost: number
  sttCost: number
  ttsCost: number
  imageCost: number
  videoCost: number
}): CostBreakdown['distribution'] {
  return [
    { label: 'Input Tokens',  value: parts.inputTokensCost,     color: 'bg-blue-500' },
    { label: 'Output Tokens', value: parts.outputTokensCost,    color: 'bg-indigo-500' },
    { label: 'Reasoning',     value: parts.reasoningTokensCost, color: 'bg-violet-500' },
    { label: 'STT',           value: parts.sttCost,             color: 'bg-emerald-500' },
    { label: 'TTS',           value: parts.ttsCost,             color: 'bg-teal-500' },
    { label: 'Images',        value: parts.imageCost,           color: 'bg-pink-500' },
    { label: 'Video',         value: parts.videoCost,           color: 'bg-rose-500' },
  ].filter((d) => d.value > 0)
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function formatCost(value: number): string {
  if (value == null || !isFinite(value) || isNaN(value)) return '—'
  if (value === 0) return '$0.00'
  if (value < 0.0001) return `$${value.toExponential(2)}`
  if (value < 0.01) return `$${value.toFixed(6)}`
  if (value < 1) return `$${value.toFixed(4)}`
  if (value < 100) return `$${value.toFixed(2)}`
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatTokens(value: number): string {
  if (value == null || !isFinite(value) || isNaN(value)) return '—'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toString()
}

export function getCostLevel(cost: number): 'low' | 'medium' | 'high' {
  if (cost < 0.001) return 'low'
  if (cost < 0.05) return 'medium'
  return 'high'
}
