import type { Context as HonoContext } from 'hono'
import { UAParser } from 'ua-parser-js'

import type { AppVariables } from '..'

export const createContext = (c: HonoContext<{ Variables: AppVariables }>) => {
  const ua = c.req.raw.headers.get('User-Agent')
  const userAgent = ua ? new UAParser(ua) : null

  return {
    addLogData: (data: Record<string, unknown>) => {
      c.set('logEvent', { ...c.get('logEvent'), ...data })
    },
    headers: c.req.raw.headers,
    request: c.req.raw,
    setHeader: (key: string, value: string) => {
      c.res.headers.set(key, value)
    },
    userAgent,
  }
}

export type Context = ReturnType<typeof createContext>
