import { expect, mock, test } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { sql } from 'kysely'
import { clearMemoizeCache, getCacheStore } from 'memoza'

const execute = mock(() => Promise.resolve({ duration: 0, result: [] }))
const cloudExecute = mock(() => Promise.resolve({ duration: 0, result: [] }))
const strings = new Map([
  ['connection', { isLocalhost: true, isPasswordPopulated: true }],
])

mock.module('~/entities/collections', () => ({
  getCollections: () => ({
    connectionStringsCollection: strings,
    connectionsCollection: new Map([
      ['connection', { isPasswordExists: true, syncType: SyncType.Cloud }],
    ]),
    connectionsResourcesCollection: new Map([
      ['resource', { connectionId: 'connection' }],
    ]),
  }),
}))
mock.module('~/lib/orpc', () => ({
  createProxyClient: () => ({ postgres: { execute } }),
  orpcProxy: { query: { postgres: { execute: cloudExecute } } },
}))
mock.module('../../store/stores', () => ({
  getConnectionStore: () => ({
    get: () => ({ proxy: { enabled: true, url: 'http://localhost:7777' } }),
  }),
}))
mock.module('../proxy', () => ({ isLocalProxyAvailable: () => true }))
Object.assign(globalThis, { window: {} })

const { createDialectProvider } = await import('./driver')
const { dialects } = await import('./index')

test('saved and unsaved connections use the available proxy', async () => {
  await Promise.all(
    [{ resourceId: 'resource' }, {}].map((ids) =>
      createDialectProvider(ConnectionType.Postgres, {
        connectionString: 'postgres://user:password@localhost/db',
        ...ids,
      }).execute({ query: 'SELECT 1', values: [] })
    )
  )
  expect(execute).toHaveBeenCalledTimes(2)
  expect(cloudExecute).not.toHaveBeenCalled()
})

test('dialect caches reuse equal inputs with fresh log callbacks', async () => {
  for (const factory of Object.values(dialects)) {
    clearMemoizeCache(factory)
    const options = {
      connectionString: 'postgres://user:password@localhost/db',
    }
    const first = factory({ ...options, log: mock() })
    const second = factory({ ...options, log: mock() })
    expect(second).toBe(first)
    expect(getCacheStore(factory)?.cache.size).toBe(1)
    clearMemoizeCache(factory)
  }
  const log = mock()
  const db = dialects.postgres({
    connectionString: 'postgres://user:password@localhost/db',
    log,
    resourceId: 'resource',
  })
  await sql`SELECT 1`.execute(db)
  expect(log).toHaveBeenCalledTimes(1)
})
