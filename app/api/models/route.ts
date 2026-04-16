import { NextResponse } from 'next/server'
import { MODEL_PRICING } from '@/lib/model-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Simulate a slight network delay as a real API would have
  await new Promise((r) => setTimeout(r, 120))

  return NextResponse.json({
    data: MODEL_PRICING,
    total: MODEL_PRICING.length,
    updatedAt: new Date().toISOString(),
  })
}
