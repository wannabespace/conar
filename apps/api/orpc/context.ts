import type { Context as HonoContext } from 'hono'
import type { AppVariables } from '..'
import { UAParser } from 'ua-parser-js'

export function createContext(c: HonoContext<{ Variables: AppVariables }>) {
  const ua = c.req.raw.headers.get('User-Agent')
  const userAgent = ua ? new UAParser(ua) : null
  const osName = userAgent?.getOS().name
  const os = osName === 'Linux'
    ? 'linux' as const
    : osName === 'macOS'
      ? 'macos' as const
      : osName === 'Windows'
        ? 'windows' as const
        : null

  const parsedAppVersion = c.get('parsedAppVersion')
  const isAppOutdated = c.get('isAppOutdated')

  return {
    request: c.req.raw,
    headers: c.req.raw.headers,
    clientId: c.req.header('x-client-id'),
    setHeader: (key: string, value: string) => {
      c.res.headers.set(key, value)
    },
    addLogData: (data: Record<string, unknown>) => {
      c.set('logEvent', { ...c.get('logEvent'), ...data })
    },
    parsedAppVersion,
    userAgent,
    os,
    isAppOutdated,
  }
}

export type Context = ReturnType<typeof createContext>
