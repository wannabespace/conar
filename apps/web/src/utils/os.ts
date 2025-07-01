import { getOS } from '@conar/shared/utils/os'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getHeader } from '@tanstack/react-start/server'

export const getOSIsomorphic = createIsomorphicFn().server(() => {
  const userAgent = getHeader('user-agent')

  if (!userAgent) {
    return null
  }

  return getOS(userAgent)
}).client(() => {
  return getOS(navigator.userAgent)
})
