import { type ModelPricing, type CalculatorConfig } from './model-data'

const CHARS_PER_TOKEN = 4
const WORDS_PER_TOKEN = 0.75 // ~0.75 tokens per word

export interface CostBreakdown {
  // Token counts
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

  // Distribution (for bar chart)
  distribution: {
    label: string
    value: number
    color: string
  }[]
}

/** Coerce a value to a finite number, returning `fallback` (default 0) for NaN / null / undefined. */
function safe(v: number | undefined | null, fallback = 0): number {
  const n = Number(v)
  return isFinite(n) ? n : fallback
}

export function calculateCost(config: CalculatorConfig, modelPricing: ModelPricing[]): CostBreakdown {
  const isImageTask = config.taskType === 'image-generation'
  const isVideoTask = config.taskType === 'video-generation'

  const model = modelPricing.find((m) => m.id === config.modelId)
  const sttModel = modelPricing.find((m) => m.id === config.sttModelId)
  const ttsModel = modelPricing.find((m) => m.id === config.ttsModelId)
  const imageModel = modelPricing.find((m) => m.id === config.imageModelId)
  const videoModel = modelPricing.find((m) => m.id === config.videoModelId)

  const hasLLM = config.aiComponents.includes('llm') && !isImageTask && !isVideoTask
  const hasSTT = config.aiComponents.includes('stt') && !isImageTask && !isVideoTask
  const hasTTS = config.aiComponents.includes('tts') && !isImageTask && !isVideoTask

  // ── Token Estimation ──────────────────────────────────────────────────
  const systemPromptTokens = Math.ceil(safe(config.systemPromptChars) / CHARS_PER_TOKEN)
  const userInputTokensPerTurn = Math.ceil(safe(config.avgUserInputChars) / CHARS_PER_TOKEN)
  const responseTokensPerTurn = Math.ceil(safe(config.avgResponseChars) / CHARS_PER_TOKEN)
  const toolDescTokens = Math.ceil(safe(config.toolDescriptionChars) / CHARS_PER_TOKEN)
  const conversationTurns = Math.max(1, safe(config.conversationTurns, 1))
  const toolCallsPerConversation = safe(config.toolCallsPerConversation)
  const reasoningMultiplier = Math.max(1, safe(config.reasoningMultiplier, 1))

  // History growth: each turn adds prior context. Growth factor ≈ turns/2 on avg
  const historyGrowthFactor = config.includeHistoryGrowth
    ? Math.ceil(conversationTurns / 2)
    : 0

  // Input tokens = system prompt + all user messages + tool descs + history growth
  const inputTokens = hasLLM
    ? systemPromptTokens +
      userInputTokensPerTurn * conversationTurns +
      toolDescTokens * toolCallsPerConversation +
      responseTokensPerTurn * historyGrowthFactor
    : 0

  // Output tokens = response per turn × turns
  const outputTokens = hasLLM ? responseTokensPerTurn * conversationTurns : 0

  // Reasoning tokens (applied to output via multiplier)
  const reasoningTokens = hasLLM
    ? Math.ceil(outputTokens * (reasoningMultiplier - 1))
    : 0

  // Cached tokens: assume system prompt + tool descs are cached
  const cachedTokens =
    config.usePromptCaching && hasLLM ? systemPromptTokens + toolDescTokens : 0

  // ── LLM Costs ─────────────────────────────────────────────────────────
  let inputTokensCost = 0
  let outputTokensCost = 0
  let reasoningTokensCost = 0
  let cachedTokensSavings = 0

  if (model && hasLLM) {
    const effectiveInputTokens = inputTokens - cachedTokens
    inputTokensCost = (effectiveInputTokens / 1_000_000) * model.inputPricePer1M
    outputTokensCost = (outputTokens / 1_000_000) * model.outputPricePer1M
    reasoningTokensCost = (reasoningTokens / 1_000_000) * model.outputPricePer1M

    if (config.usePromptCaching && model.cachedInputPricePer1M !== undefined) {
      const cachedCost = (cachedTokens / 1_000_000) * model.cachedInputPricePer1M
      const uncachedCost = (cachedTokens / 1_000_000) * model.inputPricePer1M
      cachedTokensSavings = uncachedCost - cachedCost
      inputTokensCost += cachedCost
    }
  }

  // ── Voice Costs ───────────────────────────────────────────────────────
  let sttCost = 0
  let ttsCost = 0

  if (hasSTT && sttModel?.sttPricePer1Min) {
    sttCost = safe(config.avgCallDurationMinutes) * sttModel.sttPricePer1Min
  }

  if (hasTTS && ttsModel?.ttsPricePer1KChars) {
    // Characters spoken ≈ words per turn × words per char ratio
    const wordsPerConversation = conversationTurns * (safe(config.avgResponseChars) / 5) // ~5 chars/word
    ttsCost = (wordsPerConversation / 1000) * ttsModel.ttsPricePer1KChars
  }

  // ── Image / Video Costs ───────────────────────────────────────────────
  let imageCost = 0
  let videoCost = 0

  if (isImageTask && imageModel?.imagePricePerImage != null) {
    imageCost = imageModel.imagePricePerImage * Math.max(1, safe(config.imagesPerConversation, 1))
  }

  if (isVideoTask && videoModel?.videoPricePerSecond != null) {
    videoCost = videoModel.videoPricePerSecond * Math.max(1, safe(config.videoSecondsPerConversation, 1))
  }

  // ── Totals ────────────────────────────────────────────────────────────
  const totalCostPerConversation =
    inputTokensCost +
    outputTokensCost +
    reasoningTokensCost +
    sttCost +
    ttsCost +
    imageCost +
    videoCost

  const totalCostPer1k = totalCostPerConversation * 1000
  const monthlyCost = totalCostPerConversation * Math.max(0, safe(config.monthlyUsers, 1000))

  // ── Distribution ──────────────────────────────────────────────────────
  const distribution = [
    { label: 'Input Tokens',  value: inputTokensCost,     color: 'bg-blue-500' },
    { label: 'Output Tokens', value: outputTokensCost,    color: 'bg-indigo-500' },
    ...(reasoningTokens > 0
      ? [{ label: 'Reasoning', value: reasoningTokensCost, color: 'bg-violet-500' }]
      : []),
    ...(sttCost > 0   ? [{ label: 'STT',   value: sttCost,   color: 'bg-emerald-500' }] : []),
    ...(ttsCost > 0   ? [{ label: 'TTS',   value: ttsCost,   color: 'bg-teal-500' }]    : []),
    ...(imageCost > 0 ? [{ label: 'Images', value: imageCost, color: 'bg-pink-500' }]   : []),
    ...(videoCost > 0 ? [{ label: 'Video',  value: videoCost, color: 'bg-rose-500' }]   : []),
  ].filter((d) => d.value > 0)

  return {
    inputTokens,
    outputTokens,
    reasoningTokens,
    cachedTokens,
    inputTokensCost,
    outputTokensCost,
    reasoningTokensCost,
    cachedTokensSavings,
    sttCost,
    ttsCost,
    imageCost,
    videoCost,
    totalCostPerConversation,
    totalCostPer1k,
    monthlyCost,
    distribution,
  }
}

export function formatCost(value: number, decimals = 4): string {
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
