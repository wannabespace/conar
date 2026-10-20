import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

export const getUserAgent = createIsomorphicFn()
  .server(() => getRequestHeader('user-agent') ?? null)
  .client(() => navigator.userAgent)
