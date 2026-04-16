'use client'

import { type CalculatorConfig } from '@/lib/model-data'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'

interface Props {
  config: CalculatorConfig
  onChange: (partial: Partial<CalculatorConfig>) => void
}

export function AdvancedControls({ config, onChange }: Props) {
  return (
    <div className="space-y-5">
      {/* Reasoning Multiplier */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reasoning Multiplier
          </Label>
          <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-sm font-semibold text-primary">
            ×{config.reasoningMultiplier.toFixed(1)}
          </span>
        </div>
        <Slider
          min={1.0}
          max={3.0}
          step={0.1}
          value={[config.reasoningMultiplier]}
          onValueChange={([v]) => onChange({ reasoningMultiplier: v })}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1.0× none</span>
          <span>2.0× moderate</span>
          <span>3.0× heavy</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Simulates chain-of-thought or extended reasoning token usage.
        </p>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        {[
          {
            label: 'Prompt Caching',
            description: 'Cache system prompt & tool descriptions',
            checked: config.usePromptCaching,
            onChange: (v: boolean) => onChange({ usePromptCaching: v }),
          },
          {
            label: 'History Growth',
            description: 'Simulate growing context from prior turns',
            checked: config.includeHistoryGrowth,
            onChange: (v: boolean) => onChange({ includeHistoryGrowth: v }),
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-md border border-border px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <Switch
              checked={item.checked}
              onCheckedChange={item.onChange}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
