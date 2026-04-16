'use client'

import { PRESETS, type CalculatorConfig } from '@/lib/model-data'
import { cn } from '@/lib/utils'

interface Props {
  onApply: (config: Partial<CalculatorConfig>) => void
}

export function PresetsBar({ onApply }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Quick start:</span>
      {PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onApply(preset.config)}
          title={preset.description}
          className={cn(
            'h-7 rounded-md border border-border bg-background px-3 text-xs font-medium text-muted-foreground',
            'transition-colors hover:border-foreground/30 hover:text-foreground'
          )}
        >
          {preset.name}
        </button>
      ))}
    </div>
  )
}
