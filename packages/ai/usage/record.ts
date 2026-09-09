import type { TelemetryOptions } from 'ai'

import { getModelCost } from '../models/price'
import type { AiFeature } from './feature'

export interface AiUsageScope {
  chatId?: string
  feature: AiFeature
  userId: string
}

export interface AiUsageRecord extends AiUsageScope {
  cacheReadTokens: number
  cacheWriteTokens: number
  cost: number | null
  inputTokens: number
  model: string
  outputTokens: number
}

export const createAiUsage = (
  onRecord: (record: AiUsageRecord) => Promise<void>
) => ({
  telemetry: (scope: AiUsageScope): TelemetryOptions => ({
    integrations: {
      onLanguageModelCallEnd: async ({ modelId, usage }) => {
        try {
          await onRecord({
            ...scope,
            cacheReadTokens: usage.inputTokenDetails.cacheReadTokens ?? 0,
            cacheWriteTokens: usage.inputTokenDetails.cacheWriteTokens ?? 0,
            cost: await getModelCost(modelId, usage),
            inputTokens: usage.inputTokens ?? 0,
            model: modelId,
            outputTokens: usage.outputTokens ?? 0,
          })
        } catch (error) {
          console.error('ai usage record failed', error)
        }
      },
    },
  }),
})
