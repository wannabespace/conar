import { createOpenRouter } from '@openrouter/ai-sdk-provider'

import { env } from '~/env'

export const openrouter = createOpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
})
