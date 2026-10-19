import { expect, mock, spyOn, test } from 'bun:test'

import { call } from '@orpc/server'

mock.module('~/env', () => ({
  env: { API_URL: 'https://api.test', PROXY_SHARED_SECRET: 'secret' },
}))
const { authMiddleware, orpc } = await import('./index')
const whoami = orpc
  .use(authMiddleware)
  .handler(({ context }) => context.session.userId)

test('proxy auth reads the user ID from the nested Better Auth session', async () => {
  const fetchSession = spyOn(globalThis, 'fetch').mockResolvedValue(
    Response.json({
      session: { userId: 'owner' },
      user: { id: 'owner' },
    })
  )
  const context = {
    addLogData: mock(),
    headers: new Headers({ 'x-real-ip': '203.0.113.7' }),
    request: new Request('https://proxy.test/rpc'),
    setHeader: mock(),
    userAgent: null,
  }
  try {
    expect(await call(whoami, undefined, { context })).toBe('owner')
    expect(fetchSession.mock.calls[0]?.[1]).toMatchObject({
      headers: {
        'x-client-ip': '203.0.113.7',
        'x-proxy-token': 'secret',
      },
    })
    fetchSession.mockResolvedValueOnce(Response.json(null))
    await expect(call(whoami, undefined, { context })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  } finally {
    fetchSession.mockRestore()
  }
})
