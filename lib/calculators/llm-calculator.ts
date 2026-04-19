/**
 * lib/calculators/llm-calculator.ts
 *
 * Calculates the cost of a pure LLM (text / multimodal chat) task.
 * Covers: chatbot, custom, CRM — any task that uses LLM tokens without
 * voice or media generation.
 *
 * Called by the orchestrator in cost-calculator.ts.
 */

import {
  type CalculatorConfig,
  type ModelPricing,
  type CostBreakdown,
  safe,
  buildTotals,
  buildDistribution,
} from './shared'

export interface LLMInputParams {
  /** System prompt size in tokens */
  systemPromptTokens: number
  /** User message tokens per turn */
  userInputTokensPerTurn: number
  /** Assistant response tokens per turn */
  responseTokensPerTurn: number
  /** Number of back-and-forth turns */
  conversationTurns: number
  /** Number of tool calls per conversation */
  toolCallsPerConversation: number
  /** Tool schema / description size in tokens */
  toolDescriptionTokens: number
  /** RAG context tokens injected per turn */
  ragTokensPerTurn: number
  /** Whether to simulate history growth (adds earlier turns to context) */
  includeHistoryGrowth: boolean
  /** Whether prompt caching is enabled */
  usePromptCaching: boolean
  /** Multiplier for reasoning tokens over base output (1 = no reasoning) */
  reasoningMultiplier: number
}

/** Extract and sanitise all LLM input parameters from a CalculatorConfig. */
export function extractLLMParams(config: CalculatorConfig): LLMInputParams {
  return {
    systemPromptTokens:      Math.ceil(safe(config.systemPromptChars)),
    userInputTokensPerTurn:  Math.ceil(safe(config.avgUserInputChars)),
    responseTokensPerTurn:   Math.ceil(safe(config.avgResponseChars)),
    conversationTurns:       Math.max(1, safe(config.conversationTurns, 1)),
    toolCallsPerConversation: safe(config.toolCallsPerConversation),
    toolDescriptionTokens:   Math.ceil(safe(config.toolDescriptionChars)),
    ragTokensPerTurn:        Math.ceil(safe(config.ragTokens)),
    includeHistoryGrowth:    config.includeHistoryGrowth,
    usePromptCaching:        config.usePromptCaching,
    reasoningMultiplier:     Math.max(1, safe(config.reasoningMultiplier, 1)),
  }
}

export interface LLMCostResult {
  inputTokens: number
  outputTokens: number
  reasoningTokens: number
  cachedTokens: number
  inputTokensCost: number
  outputTokensCost: number
  reasoningTokensCost: number
  cachedTokensSavings: number
}

/**
 * calculateLLMCost
 *
 * Core calculation for any LLM-based task.
 *
 * @param params   - Sanitised token parameters (use extractLLMParams)
 * @param model    - The ModelPricing entry for the selected LLM
 * @returns        - Token counts and itemised dollar costs
 */
export function calculateLLMCost(
  params: LLMInputParams,
  model: ModelPricing | undefined,
): LLMCostResult {
  const {
    systemPromptTokens,
    userInputTokensPerTurn,
    responseTokensPerTurn,
    conversationTurns,
    toolCallsPerConversation,
    toolDescriptionTokens,
    ragTokensPerTurn,
    includeHistoryGrowth,
    usePromptCaching,
    reasoningMultiplier,
  } = params

  // History accumulates earlier turns in the context window
  const historyGrowthFactor = includeHistoryGrowth
    ? Math.ceil(conversationTurns / 2)
    : 0

  // Total input = system prompt + user turns + tool schemas + RAG + history growth
  const inputTokens =
    systemPromptTokens +
    userInputTokensPerTurn * conversationTurns +
    toolDescriptionTokens * toolCallsPerConversation +
    ragTokensPerTurn * conversationTurns +
    responseTokensPerTurn * historyGrowthFactor

  // Output = response tokens × turns
  const outputTokens = responseTokensPerTurn * conversationTurns

  // Reasoning overhead on top of output tokens
  const reasoningTokens = Math.ceil(outputTokens * (reasoningMultiplier - 1))

  // Cached portion: system prompt + tool descriptions are good cache candidates
  const cachedTokens =
    usePromptCaching && model?.cachedInputPricePer1M !== undefined
      ? systemPromptTokens + toolDescriptionTokens
      : 0

  // Dollar costs
  let inputTokensCost = 0
  let outputTokensCost = 0
  let reasoningTokensCost = 0
  let cachedTokensSavings = 0

  if (model) {
    const effectiveInputTokens = inputTokens - cachedTokens
    inputTokensCost = (effectiveInputTokens / 1_000_000) * model.inputPricePer1M
    outputTokensCost = (outputTokens / 1_000_000) * model.outputPricePer1M
    reasoningTokensCost = (reasoningTokens / 1_000_000) * model.outputPricePer1M

    if (usePromptCaching && model.cachedInputPricePer1M !== undefined) {
      const cachedCost   = (cachedTokens / 1_000_000) * model.cachedInputPricePer1M
      const uncachedCost = (cachedTokens / 1_000_000) * model.inputPricePer1M
      cachedTokensSavings = uncachedCost - cachedCost
      inputTokensCost += cachedCost
    }
  }

  return {
    inputTokens,
    outputTokens,
    reasoningTokens,
    cachedTokens,
    inputTokensCost,
    outputTokensCost,
    reasoningTokensCost,
    cachedTokensSavings,
  }
}

/**
 * calculateChatbotCost / calculateCRMCost / calculateCustomCost
 *
 * Task-specific wrappers that build the full CostBreakdown from a
 * CalculatorConfig. Voice and media fields are zeroed out.
 */
function buildLLMOnlyBreakdown(
  config: CalculatorConfig,
  modelPricing: ModelPricing[],
): CostBreakdown {
  const model = modelPricing.find((m) => m.id === config.modelId)
  const params = extractLLMParams(config)
  const llm = calculateLLMCost(params, model)

  const parts = {
    inputTokensCost:     llm.inputTokensCost,
    outputTokensCost:    llm.outputTokensCost,
    reasoningTokensCost: llm.reasoningTokensCost,
    sttCost:  0,
    ttsCost:  0,
    imageCost: 0,
    videoCost: 0,
  }
  const totals = buildTotals(parts, config.monthlyUsers)

  return {
    ...llm,
    ...parts,
    ...totals,
    distribution: buildDistribution(parts),
  }
}

export const calculateChatbotCost  = buildLLMOnlyBreakdown
export const calculateCRMCost      = buildLLMOnlyBreakdown
export const calculateCustomCost   = buildLLMOnlyBreakdown
