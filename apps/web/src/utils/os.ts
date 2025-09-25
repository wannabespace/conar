import { getOS } from '@conar/shared/utils/os'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

export const getOSIsomorphic = createIsomorphicFn().server(() => {
  const userAgent = getRequestHeader('user-agent')

  if (!userAgent) {
    return null
  }

  return getOS(userAgent)
}).client(() => {
  return getOS(navigator.userAgent)
})
