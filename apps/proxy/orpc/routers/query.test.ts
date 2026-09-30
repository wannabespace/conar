import { expect, mock, test } from 'bun:test'

import { os } from '@orpc/server'
import { getCacheStore } from 'memoza'

const resolve = mock(() => Promise.resolve('postgres://user:password@host/db'))
mock.module('~/api-client', () => ({
  createApiClient: () => ({
    internal: { proxy: { resolveConnectionString: resolve } },
  }),
}))
const orpc = os.$context<{ headers: Headers }>()
mock.module('~/orpc', () => ({
  authMiddleware: orpc.middleware(({ next }) =>
    next({ context: { session: { userId: 'user' } } })
  ),
  orpc,
}))
const { resolveQueryConnectionString } = await import('./query')

test('connection resolution caches by credentials and input, not Headers identity', async () => {
  await Promise.all(
    Array.from({ length: 2 }, () =>
      resolveQueryConnectionString({
        headers: new Headers({
          authorization: 'Bearer a',
          cookie: 'session=a',
        }),
        input: { resourceId: 'resource' },
      })
    )
  )
  expect(resolve).toHaveBeenCalledTimes(1)
  expect(getCacheStore(resolveQueryConnectionString)?.cache.size).toBe(1)
  await resolveQueryConnectionString({
    headers: new Headers({ authorization: 'Bearer b', cookie: 'session=a' }),
    input: { resourceId: 'resource' },
  })
  expect(resolve).toHaveBeenCalledTimes(2)
})
