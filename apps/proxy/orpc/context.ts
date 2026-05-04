import type { Context as HonoContext } from 'hono'
import type { AppVariables } from '..'
import { UAParser } from 'ua-parser-js'

export function createContext(c: HonoContext<{ Variables: AppVariables }>) {
  const ua = c.req.raw.headers.get('User-Agent')
  const userAgent = ua ? new UAParser(ua) : null

  return {
    request: c.req.raw,
    headers: c.req.raw.headers,
    setHeader: (key: string, value: string) => {
      c.res.headers.set(key, value)
    },
    addLogData: (data: Record<string, unknown>) => {
      c.set('logEvent', { ...c.get('logEvent'), ...data })
    },
    userAgent,
  }
}

export type Context = ReturnType<typeof createContext>
