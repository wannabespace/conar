import type { Context as HonoContext } from 'hono'
import { UAParser } from 'ua-parser-js'

export function createContext(c: HonoContext) {
  const desktopVersion = c.req.header('x-desktop-version') || null
  const userAgent = c.req.raw.headers.get('User-Agent') || null
  const minorVersion = Number(desktopVersion?.split('.')[1]) || null
  const majorVersion = Number(desktopVersion?.split('.')[0]) || null

  return {
    request: c.req.raw,
    headers: c.req.raw.headers,
    setHeader: (key: string, value: string) => {
      c.res.headers.set(key, value)
    },
    desktopVersion,
    minorVersion,
    majorVersion,
    ua: userAgent ? new UAParser(userAgent) : null,
  }
}

export type Context = ReturnType<typeof createContext>
