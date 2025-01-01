import { headers } from 'next/headers'
import 'server-only'

export async function createContext() {
  return {
    headers: await headers(),
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
