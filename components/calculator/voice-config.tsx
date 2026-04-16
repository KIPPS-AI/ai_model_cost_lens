'use client'

import { type CalculatorConfig, MODEL_PRICING } from '@/lib/model-data'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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

const STT_MODELS = MODEL_PRICING.filter((m) => m.sttPricePer1Min !== undefined)
const TTS_MODELS = MODEL_PRICING.filter((m) => m.ttsPricePer1KChars !== undefined)

export function VoiceConfig({ config, onChange }: Props) {
  const hasSTT = config.aiComponents.includes('stt')
  const hasTTS = config.aiComponents.includes('tts')

  if (!hasSTT && !hasTTS) {
    return (
      <div className="flex items-center justify-center rounded-md border border-dashed border-border px-4 py-8">
        <p className="text-sm text-muted-foreground">
          Enable STT or TTS in Task Configuration to see voice options.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {hasSTT && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              STT Model
            </Label>
            <Select value={config.sttModelId} onValueChange={(v) => onChange({ sttModelId: v })}>
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STT_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-sm">
                    {m.displayName} — ${m.sttPricePer1Min}/min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="call-duration" className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-foreground">Call Duration</span>
                <span className="text-xs text-muted-foreground">min</span>
              </Label>
              <Input
                id="call-duration"
                type="number"
                min={0}
                value={config.avgCallDurationMinutes}
                onChange={(e) => {
                  const n = parseFloat(e.target.value)
                  onChange({ avgCallDurationMinutes: isFinite(n) ? Math.max(0, n) : 0 })
                }}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wpm" className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-foreground">Words / Minute</span>
                <span className="text-xs text-muted-foreground">wpm</span>
              </Label>
              <Input
                id="wpm"
                type="number"
                min={60}
                max={300}
                value={config.wordsPerMinute}
                onChange={(e) => {
                  const n = parseFloat(e.target.value)
                  onChange({ wordsPerMinute: isFinite(n) ? Math.min(300, Math.max(60, n)) : 150 })
                }}
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {hasTTS && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            TTS Model
          </Label>
          <Select value={config.ttsModelId} onValueChange={(v) => onChange({ ttsModelId: v })}>
            <SelectTrigger className="h-9 w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TTS_MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-sm">
                  {m.displayName} — ${m.ttsPricePer1KChars}/1K chars
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">Real-time Streaming</p>
          <p className="text-xs text-muted-foreground">vs batch processing</p>
        </div>
        <Switch
          checked={config.realtimeMode}
          onCheckedChange={(v) => onChange({ realtimeMode: v })}
        />
      </div>
    </div>
  )
}
