import { getHeaders } from '@tanstack/react-start/server'

export async function createContext() {
  const headers = getHeaders()
  const h = new Headers()

  h.set('cookie', headers.cookie ?? '')
  h.set('authorization', headers.authorization ?? '')

  return {
    headers: h,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
