'use client'

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

interface Props {
  config: CalculatorConfig
  onChange: (partial: Partial<CalculatorConfig>) => void
}

export function ImageVideoConfig({ config, onChange }: Props) {
  const { imageModels, videoModels, isLoading } = useModels()
  const isImage = config.taskType === 'image-generation'

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    )
  }

  if (isImage) {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Image Model
          </Label>
          <Select
            value={config.imageModelId}
            onValueChange={(v) => onChange({ imageModelId: v })}
          >
            <SelectTrigger className="h-9 w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {imageModels.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <span className="flex items-center gap-2">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {m.provider}
                    </span>
                    <span>{m.displayName}</span>
                    {m.imagePricePerImage != null && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        ${m.imagePricePerImage}/img
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(() => {
            const m = imageModels.find((x) => x.id === config.imageModelId)
            return m ? (
              <p className="text-xs text-muted-foreground">
                {m.imageResolution && `Resolution: ${m.imageResolution} · `}
                {m.imagePricePerImage != null && `$${m.imagePricePerImage} per image`}
              </p>
            ) : null
          })()}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Images per Request
          </Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={config.imagesPerConversation}
            onChange={(e) =>
              onChange({ imagesPerConversation: Math.max(1, parseInt(e.target.value) || 1) })
            }
            className="h-9 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Number of images generated per user request.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Video Model
        </Label>
        <Select
          value={config.videoModelId}
          onValueChange={(v) => onChange({ videoModelId: v })}
        >
          <SelectTrigger className="h-9 w-full text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {videoModels.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <span className="flex items-center gap-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {m.provider}
                  </span>
                  <span>{m.displayName}</span>
                  {m.videoPricePerSecond != null && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      ${m.videoPricePerSecond}/s
                    </span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(() => {
          const m = videoModels.find((x) => x.id === config.videoModelId)
          return m ? (
            <p className="text-xs text-muted-foreground">
              {m.videoResolution && `Resolution: ${m.videoResolution} · `}
              {m.videoPricePerSecond != null && `$${m.videoPricePerSecond} per second`}
            </p>
          ) : null
        })()}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Seconds of Video per Request
        </Label>
        <Input
          type="number"
          min={1}
          max={300}
          value={config.videoSecondsPerConversation}
          onChange={(e) =>
            onChange({ videoSecondsPerConversation: Math.max(1, parseInt(e.target.value) || 1) })
          }
          className="h-9 text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Duration of video generated per user request.
        </p>
      </div>
    </div>
  )
}
