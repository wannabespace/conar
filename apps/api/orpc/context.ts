import type { Context as HonoContext } from 'hono'
import type { AppVariables } from '..'
import { UAParser } from 'ua-parser-js'

export function createContext(c: HonoContext<{ Variables: AppVariables }>) {
  const desktopVersion = c.req.header('x-desktop-version')?.split('.') || null
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
  const appVersion = desktopVersion
    ? {
        major: Number(desktopVersion[0]),
        minor: Number(desktopVersion[1]),
        patch: Number(desktopVersion[2]),
      }
    : null

  return {
    request: c.req.raw,
    headers: c.req.raw.headers,
    setHeader: (key: string, value: string) => {
      c.res.headers.set(key, value)
    },
    addLogData: (data: Record<string, unknown>) => {
      c.set('logEvent', { ...c.get('logEvent'), ...data })
    },
    desktopVersion,
    appVersion,
    userAgent,
    os,
  }
}

export type Context = ReturnType<typeof createContext>
