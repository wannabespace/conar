import { expect, mock, test } from 'bun:test'

import { call, os } from '@orpc/server'
import { SyncType } from '@tamery/shared/enums/sync-type'

import type { Context } from '../../context'

mock.module('@tamery/db', () => ({
  db: {
    query: {
      connectionsResources: {
        findFirst: () =>
          Promise.resolve({
            connection: {
              connectionString: 'encrypted',
              isPasswordExists: true,
              syncType: SyncType.Cloud,
              workspaceId: 'workspace',
            },
            name: 'other database',
          }),
      },
    },
  },
}))
mock.module('@tamery/shared/crypto-node', () => ({
  decrypt: () => 'postgres://user:p@ss@host/default?sslmode=require',
}))
mock.module('~/env', () => ({ env: { PROXY_SHARED_SECRET: 'secret' } }))
const orpc = os.$context<Context>()
mock.module('~/orpc', () => ({
  authMiddleware: orpc.middleware(({ next }) =>
    next({
      context: {
        getWorkspaceSecret: () => Promise.resolve('key'),
        user: { id: 'user' },
      },
    })
  ),
  orpc,
}))
const { proxy } = await import('./proxy')

test('resource resolution selects the resource database and preserves credentials and SSL', async () => {
  const result = await call(
    proxy.resolveConnectionString,
    { resourceId: 'resource' },
    {
      context: {
        addLogData: mock(),
        clientId: undefined,
        headers: new Headers({ 'x-proxy-token': 'secret' }),
        isAppOutdated: false,
        isDesktop: false,
        os: null,
        parsedAppVersion: null,
        request: new Request('https://api.test/rpc'),
        setHeader: mock(),
        userAgent: null,
      },
    }
  )
  expect(result).toBe(
    'postgres://user:p@ss@host/other%20database?sslmode=require'
  )
})
