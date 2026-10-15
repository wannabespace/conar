import { beforeEach, expect, mock, test } from 'bun:test'

import { call, os } from '@orpc/server'
import { SyncType } from '@tamery/shared/enums/sync-type'

import type { Context } from '../../context'

const stored = {
  connectionString: '',
  isPasswordExists: false,
  syncType: SyncType.Cloud,
}
beforeEach(() => {
  stored.connectionString = 'postgres://user:p@ss@host/default?sslmode=require'
  stored.isPasswordExists = false
  stored.syncType = SyncType.Cloud
})

const connection = () => ({
  connectionString: 'encrypted',
  isPasswordExists: stored.isPasswordExists,
  syncType: stored.syncType,
  workspaceId: 'workspace',
})
mock.module('@tamery/db', () => ({
  db: {
    query: {
      connections: { findFirst: () => Promise.resolve(connection()) },
      connectionsResources: {
        findFirst: () =>
          Promise.resolve({ connection: connection(), name: 'other database' }),
      },
    },
  },
}))
mock.module('~/env', () => ({ env: { PROXY_SHARED_SECRET: 'secret' } }))
const orpc = os.$context<Context>()
mock.module('~/orpc', () => ({
  authMiddleware: orpc.middleware(({ next }) =>
    next({
      context: {
        decryptConnectionString: () => Promise.resolve(stored.connectionString),
        user: { id: 'user' },
      },
    })
  ),
  orpc,
}))
const { proxy } = await import('./proxy')

const BY_RESOURCE = { resourceId: 'resource' }

const resolve = (
  input: { resourceId: string } | { connectionId: string } = BY_RESOURCE
) =>
  call(proxy.resolveConnectionString, input, {
    context: {
      addLogData: mock(),
      clientId: undefined,
      headers: new Headers({ 'x-proxy-token': 'secret' }),
      isAppOutdated: false,
      isDesktop: false,
      parsedAppVersion: null,
      request: new Request('https://api.test/rpc'),
      setHeader: mock(),
      userAgent: null,
    },
  })

test('resource resolution selects the resource database and preserves credentials and SSL', async () => {
  expect(await resolve()).toBe(
    'postgres://user:p@ss@host/other%20database?sslmode=require'
  )
})

test('connection resolution returns the stored string unchanged', async () => {
  expect(await resolve({ connectionId: 'connection' })).toBe(
    stored.connectionString
  )
})

test('refuses a connection synced without secrets whose password was stripped', async () => {
  stored.syncType = SyncType.CloudWithoutSecrets
  stored.isPasswordExists = true

  await expect(resolve()).rejects.toThrow('secrets or connection string')
})

test('refuses a connection synced without secrets whose SSL passphrase was stripped', async () => {
  stored.syncType = SyncType.CloudWithoutSecrets
  stored.connectionString =
    'mysql://user@host/default?sslkey=key&sslpassphrase='

  await expect(resolve()).rejects.toThrow('secrets or connection string')
})
