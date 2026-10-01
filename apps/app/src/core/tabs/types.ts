import { type } from 'arktype'

export const connectionTabType = type({
  id: 'string',
  'preview?': 'boolean',
  'title?': 'string',
})

export type ConnectionTab = typeof connectionTabType.infer
