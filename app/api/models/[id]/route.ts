import { NextResponse } from 'next/server'
import { MODEL_PRICING } from '@/lib/model-data'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await new Promise((r) => setTimeout(r, 80))

  const model = MODEL_PRICING.find((m) => m.id === id)
  if (!model) {
    return NextResponse.json({ error: 'Model not found' }, { status: 404 })
  }

  return NextResponse.json({ data: model })
}
