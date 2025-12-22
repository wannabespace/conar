import type { Context as HonoContext } from 'hono'

export function createContext(c: HonoContext) {
  const cookie = c.req.header('Cookie')
  const authorization = c.req.header('Authorization')
  const desktopVersion = c.req.header('x-desktop-version') || null
  const userAgent = c.req.header('User-Agent')

  const h = new Headers()

  if (cookie)
    h.set('Cookie', cookie)

  if (authorization)
    h.set('Authorization', authorization)

  if (desktopVersion)
    h.set('x-desktop-version', desktopVersion)

  if (userAgent)
    h.set('User-Agent', userAgent)

  const minorVersion = Number(desktopVersion?.split('.')[1]) || null
  const majorVersion = Number(desktopVersion?.split('.')[0]) || null

  return {
    headers: h,
    setHeader: (key: string, value: string) => {
      c.res.headers.set(key, value)
    },
    desktopVersion,
    minorVersion,
    majorVersion,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
