import { headers } from 'next/headers'
import 'server-only'

export async function createContext() {
  const nextHeaders = await headers()
  const h = new Headers()

  h.set('cookie', nextHeaders.get('cookie') ?? '')
  h.set('authorization', nextHeaders.get('authorization') ?? '')

  return {
    headers: h,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
