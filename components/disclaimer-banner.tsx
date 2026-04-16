'use client'

import { useState } from 'react'
import { Info, X } from 'lucide-react'

export function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="border-b border-border bg-muted/50">
      <div className="mx-auto flex max-w-7xl items-center gap-2.5 px-4 py-2.5 sm:px-6">
        <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="flex-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Estimates only.</span> Actual costs vary
          based on conversation length, prompt structure, and provider tokenization.{' '}
          <span className="hidden sm:inline">Always verify with your provider before budgeting.</span>
        </p>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss notice"
          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
