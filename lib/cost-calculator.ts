/**
 * lib/cost-calculator.ts
 *
 * Orchestrator — routes to the correct per-task calculator based on
 * config.taskType. All heavy logic lives in lib/calculators/.
 *
 * Public API (consumed by the UI):
 *   calculateCost(config, modelPricing) → CostBreakdown
 *   formatCost(value)                   → string
 *   formatTokens(value)                 → string
 *   getCostLevel(cost)                  → 'low' | 'medium' | 'high'
 *   CostBreakdown                       (type)
 */

import { type ModelPricing, type CalculatorConfig } from './model-data'

// Per-task calculators
import { calculateChatbotCost, calculateCRMCost, calculateCustomCost } from './calculators/llm-calculator'
import { calculateVoiceCallCost } from './calculators/voice-calculator'
import { calculateImageCost }     from './calculators/image-calculator'
import { calculateVideoCost }     from './calculators/video-calculator'

// Re-export shared types and helpers so existing UI imports continue to work
export type { CostBreakdown } from './calculators/shared'
export { formatCost, formatTokens, getCostLevel } from './calculators/shared'

/**
 * calculateCost
 *
 * Routes to the appropriate task calculator based on config.taskType.
 * Adding a new task type only requires:
 *   1. Creating a new file in lib/calculators/
 *   2. Adding a case here
 */
export function calculateCost(
  config: CalculatorConfig,
  modelPricing: ModelPricing[],
) {
  switch (config.taskType) {
    case 'voice-call':
      return calculateVoiceCallCost(config, modelPricing)

    case 'image-generation':
      return calculateImageCost(config, modelPricing)

    case 'video-generation':
      return calculateVideoCost(config, modelPricing)

    case 'crm':
      return calculateCRMCost(config, modelPricing)

    case 'custom':
      return calculateCustomCost(config, modelPricing)

    case 'chatbot':
    default:
      return calculateChatbotCost(config, modelPricing)
  }
}
