import useSWR from 'swr'
import type { ModelPricing } from '@/lib/model-data'

interface ModelsResponse {
  data: ModelPricing[]
  total: number
  updatedAt: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useModels() {
  const { data, error, isLoading } = useSWR<ModelsResponse>('/api/models', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })

  const all = data?.data ?? []

  // Text / multimodal LLMs only — for the LLM model selector
  const llmModels = all.filter(
    (m) => (m.modality === 'text' || m.modality === 'multimodal') && m.inputPricePer1M > 0
  )

  // STT models
  const sttModels = all.filter((m) => m.sttPricePer1Min != null)

  // TTS models
  const ttsModels = all.filter((m) => m.ttsPricePer1KChars != null)

  // Image generation models
  const imageModels = all.filter((m) => m.modality === 'image')

  // Video generation models
  const videoModels = all.filter((m) => m.modality === 'video')

  return {
    models: all,
    llmModels,
    sttModels,
    ttsModels,
    imageModels,
    videoModels,
    total: data?.total ?? 0,
    updatedAt: data?.updatedAt,
    isLoading,
    error,
  }
}
