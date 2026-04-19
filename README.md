# CostLens

**AI cost estimation tool by [Kipps.AI](https://kipps.ai)**

CostLens helps developers and product teams estimate, compare, and understand the real cost of running AI-powered workloads — voice agents, chatbots, CRM automation, image generation, and more — before writing a single line of production code.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Calculator Architecture](#calculator-architecture)
  - [Task Types](#task-types)
  - [Input Parameters](#input-parameters)
  - [Algorithms](#algorithms)
    - [LLM Cost Algorithm](#llm-cost-algorithm)
    - [Voice Call Algorithm](#voice-call-algorithm)
    - [Image Generation Algorithm](#image-generation-algorithm)
    - [Video Generation Algorithm](#video-generation-algorithm)
  - [Assumptions](#assumptions)
  - [Adding a New Task Type](#adding-a-new-task-type)
- [Model Pricing Data](#model-pricing-data)
- [Extending the Model Catalogue](#extending-the-model-catalogue)
- [Data Flow](#data-flow)
- [NaN Safety](#nan-safety)
- [License](#license)

---

## Features

- **Multi-task calculator** — chatbot, voice call, CRM, image generation, video generation, custom
- **60+ models** across 15+ providers (OpenAI, Anthropic, Google, Meta, Mistral AI, xAI, DeepSeek, Cohere, Amazon, ElevenLabs, Deepgram, Stability AI, Runway, Groq, Fireworks AI, and more)
- **Model pricing table** — sortable, filterable by provider and modality, sticky sidebar filters
- **Side-by-side model comparison** — compare up to 3 models across every pricing dimension
- **Preset configurations** — WhatsApp Bot, Voice Agent, CRM Automation, Reasoning Agent, Image Batch
- **Prompt caching savings** — calculates the cost delta when caching system prompts and tool schemas
- **RAG context costing** — adds retrieved document tokens to input cost per turn
- **Reasoning token multiplier** — models reasoning overhead on top of base output tokens
- **History growth simulation** — approximates context-window growth across multi-turn conversations
- **Monthly cost projection** — scales per-conversation cost to a configurable user base
- **CSV export + share link** — export breakdowns and share calculator state via URL
- **Fully mobile responsive**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.7 |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui + Radix UI |
| Data fetching | SWR |
| Charts | Recharts |
| Icons | Lucide React |
| Runtime | React 19 |

---

## Project Structure

```
.
├── app/
│   ├── page.tsx                    # Calculator (home)
│   ├── models/
│   │   ├── page.tsx                # Model pricing table
│   │   └── [id]/page.tsx           # Individual model detail
│   └── compare/
│       └── page.tsx                # Side-by-side model comparison
│
├── components/
│   ├── calculator/
│   │   ├── calculator-section.tsx  # Main calculator shell + state
│   │   ├── presets-bar.tsx         # Quick-start preset buttons
│   │   ├── task-config.tsx         # Task type + AI component selector
│   │   ├── llm-config.tsx          # Token parameter inputs
│   │   ├── voice-config.tsx        # STT / TTS model + call duration
│   │   ├── image-video-config.tsx  # Image / video model + volume inputs
│   │   ├── advanced-controls.tsx   # RAG, history growth, caching, reasoning
│   │   └── cost-breakdown.tsx      # Results panel — totals, chart, line items
│   ├── pricing-explorer/
│   │   └── pricing-explorer.tsx    # Filterable model pricing table
│   ├── comparison/
│   │   └── model-comparison.tsx    # 3-column model comparison view
│   ├── header.tsx
│   └── site-footer.tsx
│
├── lib/
│   ├── model-data.ts               # CalculatorConfig interface, DEFAULT_CONFIG,
│   │                               # ModelPricing type, PRESETS, model catalogue
│   ├── cost-calculator.ts          # Orchestrator — routes to per-task calculators
│   └── calculators/
│       ├── shared.ts               # CostBreakdown type, safe(), formatCost(),
│       │                           # formatTokens(), buildTotals(), buildDistribution()
│       ├── llm-calculator.ts       # LLM token arithmetic (chatbot / CRM / custom)
│       ├── voice-calculator.ts     # STT + LLM + TTS combined cost
│       ├── image-calculator.ts     # Per-image flat rate
│       └── video-calculator.ts     # Per-second flat rate
│
└── hooks/
    └── use-models.ts               # SWR hook — loads and memoises model catalogue
```

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Run the development server
pnpm dev

# Build for production
pnpm build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Calculator Architecture

### Task Types

| `taskType` | Calculator file | Billing basis |
|---|---|---|
| `chatbot` | `llm-calculator.ts` | Input + output tokens |
| `voice-call` | `voice-calculator.ts` | STT (per min) + LLM tokens + TTS (per 1K chars) |
| `crm` | `llm-calculator.ts` | Input + output tokens |
| `image-generation` | `image-calculator.ts` | Per image |
| `video-generation` | `video-calculator.ts` | Per second of video |
| `custom` | `llm-calculator.ts` | Input + output tokens |

---

### Input Parameters

All parameters live on `CalculatorConfig` (`lib/model-data.ts`).

#### Token Parameters (stored as **tokens**, not characters)

| Field | Default | Description |
|---|---|---|
| `systemPromptChars` | `3000` | System prompt size in tokens |
| `avgUserInputChars` | `20` | User message tokens per turn |
| `avgResponseChars` | `40` | Assistant response tokens per turn |
| `conversationTurns` | `10` | Number of back-and-forth turns in one conversation |
| `toolCallsPerConversation` | `2` | Tool / function calls per conversation |
| `toolDescriptionChars` | `300` | Token size of tool schema injected into context |
| `ragTokens` | `0` | Retrieved document tokens injected per turn (RAG) |
| `reasoningMultiplier` | `1` | Output token overhead for reasoning models (1 = disabled) |
| `includeHistoryGrowth` | `false` | Simulate context accumulation across turns |
| `usePromptCaching` | `false` | Apply cached-token pricing to system prompt + tool schemas |

#### Voice Parameters

| Field | Default | Description |
|---|---|---|
| `avgCallDurationMinutes` | `2` | Audio duration per call (drives STT cost) |
| `wordsPerMinute` | `150` | User speaking rate (used for TTS character estimation) |
| `sttModelId` | `whisper-1` | STT model to use for transcription |
| `ttsModelId` | `tts-1` | TTS model to use for synthesis |

#### Image / Video Parameters

| Field | Default | Description |
|---|---|---|
| `imagesPerConversation` | `1` | Images generated per request |
| `videoSecondsPerConversation` | `5` | Seconds of video generated per request |
| `imageModelId` | `dall-e-3` | Image generation model |
| `videoModelId` | `runway-gen3-alpha-turbo` | Video generation model |

#### Scale Parameter

| Field | Default | Description |
|---|---|---|
| `monthlyUsers` | `1000` | Monthly active users — scales per-conversation cost to monthly total |

---

### Algorithms

#### LLM Cost Algorithm

**File:** `lib/calculators/llm-calculator.ts` → `calculateLLMCost(params, model)`

```
inputTokens =
    systemPromptTokens
  + (userInputTokensPerTurn × conversationTurns)
  + (toolDescriptionTokens × toolCallsPerConversation)
  + (ragTokensPerTurn × conversationTurns)
  + (responseTokensPerTurn × historyGrowthFactor)   ← 0 when disabled

outputTokens =
    responseTokensPerTurn × conversationTurns

reasoningTokens =
    outputTokens × (reasoningMultiplier − 1)         ← 0 when multiplier = 1

cachedTokens =
    systemPromptTokens + toolDescriptionTokens       ← 0 when caching disabled

effectiveInputTokens = inputTokens − cachedTokens

inputTokensCost     = (effectiveInputTokens  / 1,000,000) × model.inputPricePer1M
cachedTokensCost    = (cachedTokens          / 1,000,000) × model.cachedInputPricePer1M
outputTokensCost    = (outputTokens          / 1,000,000) × model.outputPricePer1M
reasoningTokensCost = (reasoningTokens       / 1,000,000) × model.outputPricePer1M

cachedTokensSavings =
    cachedTokens / 1,000,000 × (inputPricePer1M − cachedInputPricePer1M)
```

**History growth factor:**

When `includeHistoryGrowth = true`, each turn carries the accumulated responses of all prior turns. The factor used is a conservative approximation:

```
historyGrowthFactor = ceil(conversationTurns / 2)
```

This adds `responseTokensPerTurn × ceil(turns/2)` extra input tokens to represent the growing context window.

---

#### Voice Call Algorithm

**File:** `lib/calculators/voice-calculator.ts` → `calculateVoiceCallCost(config, modelPricing)`

```
STT cost:
    sttCost = callDurationMinutes × sttModel.sttPricePer1Min

TTS cost:
    wordsPerConversation = conversationTurns × responseTokensPerTurn × 0.75
    charsPerConversation = wordsPerConversation × 5
    ttsCost = (charsPerConversation / 1,000) × ttsModel.ttsPricePer1KChars

LLM cost:
    → same as LLM algorithm above (when llm component is active)

totalCostPerConversation = sttCost + llmCost + ttsCost
```

Constants:
- `WORDS_PER_TOKEN = 0.75` — average English token-to-word ratio
- `CHARS_PER_WORD = 5` — average word length for TTS character billing

---

#### Image Generation Algorithm

**File:** `lib/calculators/image-calculator.ts` → `calculateImageGenerationCost(params, model)`

```
imageCost = imageModel.imagePricePerImage × imagesPerConversation
```

Image models are billed at a flat rate per image, independent of resolution or prompt length (resolution metadata is displayed for reference but does not affect cost).

---

#### Video Generation Algorithm

**File:** `lib/calculators/video-calculator.ts` → `calculateVideoGenerationCost(params, model)`

```
videoCost = videoModel.videoPricePerSecond × videoSecondsPerConversation
```

Video models are billed per second of generated output.

---

#### Monthly Cost and Per-1K Cost

Computed in `lib/calculators/shared.ts` → `buildTotals()`:

```
totalCostPerConversation = sum of all component costs
totalCostPer1k           = totalCostPerConversation × 1,000
monthlyCost              = totalCostPerConversation × monthlyUsers
```

---

### Assumptions

| Assumption | Value | Rationale |
|---|---|---|
| Token-to-word ratio | `0.75 words/token` | Standard approximation for English text |
| Average word length (TTS) | `5 chars/word` | Used to convert spoken words to billable characters |
| History growth approximation | `ceil(turns / 2)` | Conservative linear growth; real growth is turn-accumulative but varies by conversation |
| Reasoning tokens billed as output | Yes | Providers (OpenAI o-series, Claude) bill reasoning tokens at the output token rate |
| Cached tokens always include system prompt + tool schemas | Yes | These are the most stable, largest, and most cache-efficient portions of the prompt |
| RAG tokens injected every turn | Yes | Assumes a fresh retrieval result is inserted per user message |
| Tool schema tokens multiplied by tool call count | Yes | Each tool call injects its schema into the context |
| Minimum conversation turns | `1` | Prevents division-by-zero and zero-cost outputs |
| Minimum images per request | `1` | Prevents zero-cost image outputs |
| Minimum video seconds | `1` | Prevents zero-cost video outputs |
| `safe()` fallback | `0` | All numeric fields use `safe(v, fallback)` which returns `fallback` when `v` is `NaN`, `Infinity`, `null`, or `undefined` |

---

### Adding a New Task Type

1. Add the new type string to the `TaskType` union in `lib/model-data.ts`:
   ```ts
   export type TaskType = 'chatbot' | 'voice-call' | 'crm' | ... | 'your-new-type'
   ```

2. Create `lib/calculators/your-new-calculator.ts` and export a function with the signature:
   ```ts
   export function calculateYourNewCost(
     config: CalculatorConfig,
     modelPricing: ModelPricing[],
   ): CostBreakdown
   ```

3. Add a `case` to the switch in `lib/cost-calculator.ts`:
   ```ts
   case 'your-new-type':
     return calculateYourNewCost(config, modelPricing)
   ```

4. Add a task selector entry in `components/calculator/task-config.tsx`.

No other files need to change.

---

## Model Pricing Data

All model data lives in `lib/model-data.ts` as a static `MODEL_PRICING` array. The `ModelPricing` interface is:

```ts
interface ModelPricing {
  id: string                        // Unique identifier used in CalculatorConfig
  displayName: string               // Human-readable name shown in the UI
  provider: string                  // Open string — any provider name works
  modality: 'text' | 'multimodal' | 'audio' | 'image' | 'video'

  // LLM pricing (text / multimodal models)
  inputPricePer1M?: number          // USD per 1M input tokens
  outputPricePer1M?: number         // USD per 1M output tokens
  cachedInputPricePer1M?: number    // USD per 1M cached input tokens
  contextLength?: number            // Maximum context window in tokens

  // Audio models (STT)
  sttPricePer1Min?: number          // USD per minute of audio transcribed

  // TTS models
  ttsPricePer1KChars?: number       // USD per 1K characters synthesised

  // Image models
  imagePricePerImage?: number       // USD per image generated
  imageResolution?: string          // e.g. "1024×1024"

  // Video models
  videoPricePerSecond?: number      // USD per second of video generated
  videoResolution?: string          // e.g. "720p"
}
```

---

## Extending the Model Catalogue

Provider and modality filter lists in the pricing table are derived **dynamically** from the loaded model data — no hardcoded lists need to be updated.

To add a new provider or model:

1. Add an entry to `MODEL_PRICING` in `lib/model-data.ts`.
2. Set `provider` to any string — the UI will automatically include it in the filter sidebar.
3. Set `modality` to one of the five supported values. If a new modality is needed, add it to the `Modality` union type and add a `MODALITY_ORDER` entry in `pricing-explorer.tsx`.
4. Badge colours in the pricing table and comparison view are assigned automatically using a deterministic hash of the provider name string — no colour map needs updating.

---

## Data Flow

```
User interacts with calculator inputs
        ↓
CalculatorConfig state (in calculator-section.tsx)
        ↓
calculateCost(config, modelPricing)   ← cost-calculator.ts (orchestrator)
        ↓
routes via config.taskType switch
        ↓
per-task calculator (llm / voice / image / video)
        ↓
CostBreakdown object
        ↓
cost-breakdown.tsx renders totals, distribution chart, and line items
```

---

## NaN Safety

Every numeric user input uses `parseFloat` + `isFinite` before updating state, so clearing a field never propagates `NaN` into calculations. Inside each calculator, the `safe(value, fallback)` utility coerces any non-finite number to its fallback before use. `formatCost()` and `formatTokens()` both return `"—"` if their input is non-finite, ensuring the UI always shows a legible value.

---

## License

MIT — see [LICENSE](./LICENSE) for details.

Built with by [Kipps.AI](https://kipps.ai).
