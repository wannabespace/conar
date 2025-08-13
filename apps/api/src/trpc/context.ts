import type { Context as HonoContext } from 'hono'

export function createContext(c: HonoContext) {
  const cookie = c.req.header('Cookie')
  const authorization = c.req.header('Authorization')

  const h = new Headers()

  if (cookie)
    h.set('Cookie', cookie)

  if (authorization)
    h.set('Authorization', authorization)

  return {
    headers: h,
    setHeader: (key: string, value: string) => {
      c.res.headers.set(key, value)
    },
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
