/**
 * lib/calculators/image-calculator.ts
 *
 * Calculates the cost of an image-generation task.
 * Billed per image at a flat rate (no token pricing).
 *
 * Called by the orchestrator in cost-calculator.ts.
 */

import { type CalculatorConfig, type ModelPricing, type CostBreakdown } from './shared'
import { safe, buildTotals, buildDistribution } from './shared'

export interface ImageInputParams {
  /** Number of images generated per conversation / request */
  imagesPerConversation: number
  /** Selected image model id */
  imageModelId: string
}

/** Extract and sanitise image generation parameters from a CalculatorConfig. */
export function extractImageParams(config: CalculatorConfig): ImageInputParams {
  return {
    imagesPerConversation: Math.max(1, safe(config.imagesPerConversation, 1)),
    imageModelId: config.imageModelId,
  }
}

export interface ImageCostResult {
  imageCost: number
  /** Resolved price per image (0 if model not found) */
  pricePerImage: number
  /** Resolved resolution string (empty string if model not found) */
  resolution: string
}

/**
 * calculateImageGenerationCost
 *
 * @param params       - Sanitised image parameters (use extractImageParams)
 * @param imageModel   - ModelPricing entry for the selected image model
 * @returns            - Itemised image cost and metadata
 */
export function calculateImageGenerationCost(
  params: ImageInputParams,
  imageModel: ModelPricing | undefined,
): ImageCostResult {
  const pricePerImage = imageModel?.imagePricePerImage ?? 0
  const resolution    = imageModel?.imageResolution ?? ''
  const imageCost     = pricePerImage * params.imagesPerConversation

  return { imageCost, pricePerImage, resolution }
}

/**
 * calculateImageCost
 *
 * Full CostBreakdown for an image-generation task.
 * All token and voice fields are zero.
 */
export function calculateImageCost(
  config: CalculatorConfig,
  modelPricing: ModelPricing[],
): CostBreakdown {
  const imageModel = modelPricing.find((m) => m.id === config.imageModelId)
  const params     = extractImageParams(config)
  const result     = calculateImageGenerationCost(params, imageModel)

  const parts = {
    inputTokensCost:     0,
    outputTokensCost:    0,
    reasoningTokensCost: 0,
    sttCost:   0,
    ttsCost:   0,
    imageCost: result.imageCost,
    videoCost: 0,
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
