import { expect, mock, test } from 'bun:test'

import { call, os } from '@orpc/server'

import type { Context } from '../../../context'

const set = mock(() => Promise.resolve())
mock.module('./code-challenge', () => ({
  codeChallengePublisher: { publish: mock() },
  codeChallengeRedis: { set },
}))
const orpc = os.$context<Context>()
mock.module('~/orpc', () => ({
  authMiddleware: orpc.middleware(({ next }) =>
    next({ context: { user: { id: 'guest', isAnonymous: true } } })
  ),
  orpc,
}))
const { publish } = await import('./publish')

test('a guest cannot publish a challenge, so exchange never moves data into a guest', async () => {
  await expect(
    call(
      publish,
      { codeChallenge: 'challenge' },
      {
        context: {
          addLogData: mock(),
          clientId: undefined,
          headers: new Headers(),
          isAppOutdated: false,
          isDesktop: true,
          os: null,
          parsedAppVersion: null,
          request: new Request('https://api.test/rpc'),
          setHeader: mock(),
          userAgent: null,
        },
      }
    )
  ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  expect(set).not.toHaveBeenCalled()
})
