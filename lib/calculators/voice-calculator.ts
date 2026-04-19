/**
 * lib/calculators/voice-calculator.ts
 *
 * Calculates the cost of a voice-call task that combines:
 *   - STT  (speech-to-text)   — billed per audio minute
 *   - LLM  (reasoning)        — billed per token
 *   - TTS  (text-to-speech)   — billed per 1K chars / words
 *
 * Called by the orchestrator in cost-calculator.ts.
 */

import { type CalculatorConfig, type ModelPricing, type CostBreakdown } from './shared'
import { safe, buildTotals, buildDistribution } from './shared'
import { calculateLLMCost, extractLLMParams } from './llm-calculator'

const WORDS_PER_TOKEN = 0.75  // ~0.75 words per token
const CHARS_PER_WORD  = 5     // average word length for TTS char billing

export interface VoiceInputParams {
  /** Average call duration in minutes (drives STT cost) */
  callDurationMinutes: number
  /** Average words per minute spoken by the user */
  wordsPerMinute: number
  /** Whether STT component is active */
  hasSTT: boolean
  /** Whether TTS component is active */
  hasTTS: boolean
  /** Whether LLM component is active */
  hasLLM: boolean
}

/** Extract and sanitise voice-specific parameters from a CalculatorConfig. */
export function extractVoiceParams(config: CalculatorConfig): VoiceInputParams {
  return {
    callDurationMinutes: safe(config.avgCallDurationMinutes),
    wordsPerMinute:      Math.max(60, safe(config.wordsPerMinute, 150)),
    hasSTT: config.aiComponents.includes('stt'),
    hasTTS: config.aiComponents.includes('tts'),
    hasLLM: config.aiComponents.includes('llm'),
  }
}

export interface VoiceCostResult {
  sttCost: number
  ttsCost: number
}

/**
 * calculateVoiceComponentCosts
 *
 * Computes STT and TTS costs independently of the LLM cost.
 *
 * @param voiceParams  - Sanitised voice parameters (use extractVoiceParams)
 * @param llmTurns     - Number of conversation turns (for TTS word count)
 * @param responseTokensPerTurn - LLM response tokens per turn (for TTS estimate)
 * @param sttModel     - ModelPricing entry for the STT model
 * @param ttsModel     - ModelPricing entry for the TTS model
 */
export function calculateVoiceComponentCosts(
  voiceParams: VoiceInputParams,
  llmTurns: number,
  responseTokensPerTurn: number,
  sttModel: ModelPricing | undefined,
  ttsModel: ModelPricing | undefined,
): VoiceCostResult {
  let sttCost = 0
  let ttsCost = 0

  if (voiceParams.hasSTT && sttModel?.sttPricePer1Min) {
    sttCost = voiceParams.callDurationMinutes * sttModel.sttPricePer1Min
  }

  if (voiceParams.hasTTS && ttsModel?.ttsPricePer1KChars) {
    // Estimate characters spoken: response tokens → words → chars
    const wordsPerConversation = llmTurns * responseTokensPerTurn * WORDS_PER_TOKEN
    const charsPerConversation = wordsPerConversation * CHARS_PER_WORD
    ttsCost = (charsPerConversation / 1_000) * ttsModel.ttsPricePer1KChars
  }

  return { sttCost, ttsCost }
}

/**
 * calculateVoiceCallCost
 *
 * Full CostBreakdown for a voice-call task, combining STT + LLM + TTS.
 */
export function calculateVoiceCallCost(
  config: CalculatorConfig,
  modelPricing: ModelPricing[],
): CostBreakdown {
  const model    = modelPricing.find((m) => m.id === config.modelId)
  const sttModel = modelPricing.find((m) => m.id === config.sttModelId)
  const ttsModel = modelPricing.find((m) => m.id === config.ttsModelId)

  const voiceParams = extractVoiceParams(config)
  const llmParams   = extractLLMParams(config)

  // LLM tokens and costs (only when llm component is active)
  const llm = voiceParams.hasLLM
    ? calculateLLMCost(llmParams, model)
    : {
        inputTokens: 0, outputTokens: 0, reasoningTokens: 0, cachedTokens: 0,
        inputTokensCost: 0, outputTokensCost: 0, reasoningTokensCost: 0, cachedTokensSavings: 0,
      }

  // STT + TTS costs
  const voice = calculateVoiceComponentCosts(
    voiceParams,
    llmParams.conversationTurns,
    llmParams.responseTokensPerTurn,
    sttModel,
    ttsModel,
  )

  const parts = {
    inputTokensCost:     llm.inputTokensCost,
    outputTokensCost:    llm.outputTokensCost,
    reasoningTokensCost: llm.reasoningTokensCost,
    sttCost:   voice.sttCost,
    ttsCost:   voice.ttsCost,
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
