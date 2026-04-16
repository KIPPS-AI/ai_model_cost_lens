'use client'

import { useState } from 'react'
import { type CalculatorConfig } from '@/lib/model-data'
import { useModels } from '@/hooks/use-models'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'

interface Props {
  config: CalculatorConfig
  onChange: (partial: Partial<CalculatorConfig>) => void
}

function Field({
  id,
  label,
  hint,
  value,
  onChange,
  min = 0,
  fallback = 0,
}: {
  id: string
  label: string
  hint?: string
  value: number
  onChange: (v: number) => void
  min?: number
  fallback?: number
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-foreground">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </Label>
      <Input
        id={id}
        type="number"
        min={min}
        value={value}
        onChange={(e) => {
          const n = parseFloat(e.target.value)
          onChange(isFinite(n) ? Math.max(min, n) : fallback)
        }}
        className="h-9 text-sm"
      />
    </div>
  )
}

export function LLMConfig({ config, onChange }: Props) {
  const [search, setSearch] = useState('')
  const { llmModels, isLoading } = useModels()

  const filtered = llmModels.filter(
    (m) =>
      m.displayName.toLowerCase().includes(search.toLowerCase()) ||
      m.apiName.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      {/* Model selector */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Model
        </Label>
        {isLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-8 text-sm"
              />
            </div>
            <Select value={config.modelId} onValueChange={(v) => onChange({ modelId: v })}>
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {filtered.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex items-center gap-2">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {m.provider}
                      </span>
                      <span>{m.displayName}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* Token parameters */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Token Parameters</p>
        <div className="grid grid-cols-2 gap-3">
          <Field
            id="system-prompt"
            label="System Prompt"
            hint="chars"
            value={config.systemPromptChars}
            onChange={(v) => onChange({ systemPromptChars: v })}
          />
          <Field
            id="user-input"
            label="User Input"
            hint="chars / msg"
            value={config.avgUserInputChars}
            onChange={(v) => onChange({ avgUserInputChars: v })}
          />
          <Field
            id="response-length"
            label="Response Length"
            hint="chars"
            value={config.avgResponseChars}
            onChange={(v) => onChange({ avgResponseChars: v })}
          />
          <Field
            id="turns"
            label="Conv. Turns"
            value={config.conversationTurns}
            min={1}
            fallback={1}
            onChange={(v) => onChange({ conversationTurns: Math.max(1, v) })}
          />
          <Field
            id="tool-calls"
            label="Tool Calls"
            hint="per conv."
            value={config.toolCallsPerConversation}
            onChange={(v) => onChange({ toolCallsPerConversation: v })}
          />
          <Field
            id="tool-desc"
            label="Tool Schema"
            hint="chars"
            value={typeof config.toolDescriptionChars === 'number' ? config.toolDescriptionChars : 0}
            onChange={(v) => onChange({ toolDescriptionChars: v })}
          />
        </div>
      </div>
    </div>
  )
}
