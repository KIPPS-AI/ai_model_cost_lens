'use client'

import { type CalculatorConfig } from '@/lib/model-data'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  config: CalculatorConfig
  onChange: (partial: Partial<CalculatorConfig>) => void
}

const TASK_TYPES = [
  { value: 'chatbot',          label: 'Chatbot',           description: 'Conversational LLM assistant' },
  { value: 'voice-call',       label: 'Voice Call',        description: 'STT + LLM + TTS pipeline' },
  { value: 'crm',              label: 'CRM Operation',     description: 'Data enrichment & classification' },
  { value: 'image-generation', label: 'Image Generation',  description: 'Text-to-image model costs' },
  { value: 'video-generation', label: 'Video Generation',  description: 'Text-to-video model costs' },
  { value: 'custom',           label: 'Custom',            description: 'Configure everything manually' },
] as const

const AI_COMPONENTS = [
  { value: 'llm',       label: 'LLM',            description: 'Language model inference' },
  { value: 'stt',       label: 'Speech-to-Text', description: 'Audio transcription' },
  { value: 'tts',       label: 'Text-to-Speech', description: 'Voice synthesis' },
  { value: 'streaming', label: 'Streaming',       description: 'Real-time token streaming' },
] as const

// Which components are relevant for each task type
const RELEVANT_COMPONENTS: Record<CalculatorConfig['taskType'], readonly (typeof AI_COMPONENTS[number]['value'])[]> = {
  'chatbot':          ['llm', 'streaming'],
  'voice-call':       ['llm', 'stt', 'tts'],
  'crm':              ['llm'],
  'image-generation': [],
  'video-generation': [],
  'custom':           ['llm', 'stt', 'tts', 'streaming'],
}

export function TaskConfig({ config, onChange }: Props) {
  const toggleComponent = (comp: 'llm' | 'stt' | 'tts' | 'streaming') => {
    const has = config.aiComponents.includes(comp)
    const next = has
      ? config.aiComponents.filter((c) => c !== comp)
      : [...config.aiComponents, comp]
    onChange({ aiComponents: next })
  }

  const handleTaskChange = (value: string) => {
    const taskType = value as CalculatorConfig['taskType']
    // Auto-select relevant components when switching task type
    const defaults: Partial<CalculatorConfig> = { taskType }
    if (taskType !== 'custom') {
      defaults.aiComponents = [...RELEVANT_COMPONENTS[taskType]] as CalculatorConfig['aiComponents']
    }
    onChange(defaults)
  }

  const isImageOrVideo =
    config.taskType === 'image-generation' || config.taskType === 'video-generation'
  const relevantComps = RELEVANT_COMPONENTS[config.taskType]

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="task-type" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Task Type
        </Label>
        <Select value={config.taskType} onValueChange={handleTaskChange}>
          <SelectTrigger id="task-type" className="h-9 w-full text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TASK_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                <span className="flex flex-col">
                  <span>{t.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(() => {
          const found = TASK_TYPES.find((t) => t.value === config.taskType)
          return found ? (
            <p className="text-xs text-muted-foreground">{found.description}</p>
          ) : null
        })()}
      </div>

      {/* AI Components — hidden for image/video task types */}
      {!isImageOrVideo && (
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            AI Components
          </Label>
          <div className="divide-y divide-border rounded-md border border-border">
            {AI_COMPONENTS.map((comp) => {
              const checked = config.aiComponents.includes(comp.value)
              const relevant = relevantComps.includes(comp.value as typeof relevantComps[number])
              return (
                <label
                  key={comp.value}
                  htmlFor={`comp-${comp.value}`}
                  className="flex cursor-pointer items-center gap-3 px-3.5 py-3 hover:bg-muted/40 transition-colors first:rounded-t-md last:rounded-b-md"
                >
                  <Checkbox
                    id={`comp-${comp.value}`}
                    checked={checked}
                    onCheckedChange={() => toggleComponent(comp.value)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{comp.label}</p>
                      {config.taskType !== 'custom' && relevant && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                          recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{comp.description}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Informational note for image/video */}
      {isImageOrVideo && (
        <div className="rounded-md border border-border bg-muted/40 px-3.5 py-3">
          <p className="text-xs text-muted-foreground">
            {config.taskType === 'image-generation'
              ? 'Configure the image model and images-per-request below. Token-based LLM components are not used.'
              : 'Configure the video model and seconds-per-request below. Token-based LLM components are not used.'}
          </p>
        </div>
      )}
    </div>
  )
}
