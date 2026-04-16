'use client'

import { useState, useMemo, useCallback } from 'react'
import { DEFAULT_CONFIG, type CalculatorConfig } from '@/lib/model-data'
import { calculateCost } from '@/lib/cost-calculator'
import { useModels } from '@/hooks/use-models'
import { TaskConfig } from './task-config'
import { LLMConfig } from './llm-config'
import { VoiceConfig } from './voice-config'
import { AdvancedControls } from './advanced-controls'
import { CostBreakdownPanel } from './cost-breakdown'
import { PresetsBar } from './presets-bar'
import { ImageVideoConfig } from './image-video-config'
import { Button } from '@/components/ui/button'
import { Download, Share2, RotateCcw, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'

function SectionCard({
  title,
  description,
  children,
  defaultOpen = true,
}: {
  title: string
  description?: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && <div className="border-t border-border px-5 py-5">{children}</div>}
    </div>
  )
}

export function CalculatorSection() {
  const [config, setConfig] = useState<CalculatorConfig>(DEFAULT_CONFIG)
  const { toast } = useToast()
  const { models } = useModels()

  const updateConfig = useCallback((partial: Partial<CalculatorConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }))
  }, [])

  const breakdown = useMemo(() => calculateCost(config, models), [config, models])

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG)
    toast({ title: 'Reset to defaults', duration: 2000 })
  }

  const handleShare = () => {
    const params = new URLSearchParams()
    Object.entries(config).forEach(([k, v]) => {
      params.set(k, Array.isArray(v) ? v.join(',') : String(v))
    })
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`
    navigator.clipboard.writeText(url)
    toast({ title: 'Link copied to clipboard', duration: 2500 })
  }

  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Model', config.modelId],
      ['Input Tokens', breakdown.inputTokens],
      ['Output Tokens', breakdown.outputTokens],
      ['Reasoning Tokens', breakdown.reasoningTokens],
      ['Cached Tokens', breakdown.cachedTokens],
      ['Input Token Cost', breakdown.inputTokensCost],
      ['Output Token Cost', breakdown.outputTokensCost],
      ['Reasoning Token Cost', breakdown.reasoningTokensCost],
      ['Cached Savings', breakdown.cachedTokensSavings],
      ['STT Cost', breakdown.sttCost],
      ['TTS Cost', breakdown.ttsCost],
      ['Cost per Conversation', breakdown.totalCostPerConversation],
      ['Cost per 1K Conversations', breakdown.totalCostPer1k],
      ['Monthly Cost', breakdown.monthlyCost],
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'ai-cost-estimate.csv'
    a.click()
    toast({ title: 'CSV exported', duration: 2000 })
  }

  return (
    <section id="calculator" className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Cost Calculator
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Estimate costs for AI workflows — from single conversations to millions per month.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare} className="h-8 gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground">
            <Share2 className="h-3 w-3" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-8 gap-1.5 px-3 text-xs">
            <Download className="h-3 w-3" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Presets */}
      <PresetsBar onApply={updateConfig} />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        {/* Left: config panels */}
        <div className="space-y-3 xl:col-span-3">
          <SectionCard title="Task Configuration" description="Select task type and AI components">
            <TaskConfig config={config} onChange={updateConfig} />
          </SectionCard>

          {(config.taskType === 'image-generation' || config.taskType === 'video-generation') ? (
            <SectionCard
              title={config.taskType === 'image-generation' ? 'Image Model' : 'Video Model'}
              description={config.taskType === 'image-generation'
                ? 'Select image generation model and quantity'
                : 'Select video generation model and duration'}
            >
              <ImageVideoConfig config={config} onChange={updateConfig} />
            </SectionCard>
          ) : (
            <>
              <SectionCard title="LLM Configuration" description="Model selection and token parameters">
                <LLMConfig config={config} onChange={updateConfig} />
              </SectionCard>

              <SectionCard
                title="Voice Configuration"
                description="STT and TTS model settings"
                defaultOpen={config.aiComponents.includes('stt') || config.aiComponents.includes('tts')}
              >
                <VoiceConfig config={config} onChange={updateConfig} />
              </SectionCard>
            </>
          )}

          <SectionCard title="Advanced Controls" description="Reasoning, caching, and growth settings" defaultOpen={false}>
            <AdvancedControls config={config} onChange={updateConfig} />
          </SectionCard>
        </div>

        {/* Right: cost breakdown */}
        <div className="xl:col-span-2">
          <div className="xl:sticky xl:top-[57px]">
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold text-foreground">Cost Estimate</h2>
                <p className="text-xs text-muted-foreground">Updates live as you configure</p>
              </div>
              <div className="p-5">
                <CostBreakdownPanel
                  breakdown={breakdown}
                  config={config}
                  onMonthlyUsersChange={(v) => updateConfig({ monthlyUsers: v })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toaster />
    </section>
  )
}
