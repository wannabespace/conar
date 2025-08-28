import type { LanguageModelV2 } from '@ai-sdk/provider'
import { withTracing } from '@posthog/ai'
import { PostHog } from 'posthog-node'
import { env } from '~/env'

export const posthog = env.POSTHOG_API_KEY
  ? new PostHog(env.POSTHOG_API_KEY, { host: 'https://eu.i.posthog.com' })
  : null

export function withPosthog(model: LanguageModelV2, {
  userId,
  ...properties
}: {
  userId: string
  [key: string]: string | number | boolean
}): LanguageModelV2 {
  if (!posthog)
    return model

  return withTracing(model, posthog, {
    posthogProperties: properties,
    posthogPrivacyMode: true,
    posthogDistinctId: userId,
  })
}
