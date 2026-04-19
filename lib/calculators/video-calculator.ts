/**
 * lib/calculators/video-calculator.ts
 *
 * Calculates the cost of a video-generation task.
 * Billed per second of generated video at a flat rate.
 *
 * Called by the orchestrator in cost-calculator.ts.
 */

import { type CalculatorConfig, type ModelPricing, type CostBreakdown } from './shared'
import { safe, buildTotals, buildDistribution } from './shared'

export interface VideoInputParams {
  /** Duration of video generated per conversation / request (seconds) */
  videoSecondsPerConversation: number
  /** Selected video model id */
  videoModelId: string
}

/** Extract and sanitise video generation parameters from a CalculatorConfig. */
export function extractVideoParams(config: CalculatorConfig): VideoInputParams {
  return {
    videoSecondsPerConversation: Math.max(1, safe(config.videoSecondsPerConversation, 1)),
    videoModelId: config.videoModelId,
  }
}

export interface VideoCostResult {
  videoCost: number
  /** Resolved price per second (0 if model not found) */
  pricePerSecond: number
  /** Resolved resolution string (empty string if model not found) */
  resolution: string
}

/**
 * calculateVideoGenerationCost
 *
 * @param params       - Sanitised video parameters (use extractVideoParams)
 * @param videoModel   - ModelPricing entry for the selected video model
 * @returns            - Itemised video cost and metadata
 */
export function calculateVideoGenerationCost(
  params: VideoInputParams,
  videoModel: ModelPricing | undefined,
): VideoCostResult {
  const pricePerSecond = videoModel?.videoPricePerSecond ?? 0
  const resolution     = videoModel?.videoResolution ?? ''
  const videoCost      = pricePerSecond * params.videoSecondsPerConversation

  return { videoCost, pricePerSecond, resolution }
}

/**
 * calculateVideoCost
 *
 * Full CostBreakdown for a video-generation task.
 * All token and voice fields are zero.
 */
export function calculateVideoCost(
  config: CalculatorConfig,
  modelPricing: ModelPricing[],
): CostBreakdown {
  const videoModel = modelPricing.find((m) => m.id === config.videoModelId)
  const params     = extractVideoParams(config)
  const result     = calculateVideoGenerationCost(params, videoModel)

  const parts = {
    inputTokensCost:     0,
    outputTokensCost:    0,
    reasoningTokensCost: 0,
    sttCost:   0,
    ttsCost:   0,
    imageCost: 0,
    videoCost: result.videoCost,
  }
  const totals = buildTotals(parts, config.monthlyUsers)

  return {
    inputTokens:      0,
    outputTokens:     0,
    reasoningTokens:  0,
    cachedTokens:     0,
    cachedTokensSavings: 0,
    ...parts,
    ...totals,
    distribution: buildDistribution(parts),
  }
}
