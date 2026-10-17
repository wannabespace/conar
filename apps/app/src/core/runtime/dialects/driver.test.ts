import { expect, mock, test } from 'bun:test'

import { Dialect } from '@tamery/shared/enums/connection-type'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { sql } from 'kysely'
import { clearMemoizeCache, getCacheStore } from 'memoza'

const execute = mock((_input: object) =>
  Promise.resolve({ duration: 0, result: [] })
)
const cloudExecute = mock(() => Promise.resolve({ duration: 0, result: [] }))

mock.module('~/core/collections', () => ({
  getCollections: () => ({
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
mock.module('../../connection/stores', () => ({
  getConnectionStore: () => ({
    get: () => ({ proxy: { enabled: true, url: 'http://localhost:7777' } }),
  }),
}))
mock.module('../proxy', () => ({ isLocalProxyAvailable: () => true }))
Object.assign(globalThis, { window: {} })

const { createDialectProvider } = await import('./driver')
const { dialects } = await import('./index')

test("saved and unsaved connections send this device's string to the local proxy", async () => {
  const connectionString = 'postgres://user:password@localhost/db'
  await Promise.all(
    [{ resourceId: 'resource' }, {}].map((ids) =>
      createDialectProvider(Dialect.Postgres, {
        connectionString,
        ...ids,
      }).execute({ query: 'SELECT 1', values: [] })
    )
  )
  expect(execute).toHaveBeenCalledTimes(2)
  for (const [input] of execute.mock.calls) {
    expect(input).toMatchObject({ connectionString })
    expect(input).not.toHaveProperty('resourceId')
  }
  expect(cloudExecute).not.toHaveBeenCalled()
})

test('a connection that cannot send refuses with its reason', () => {
  execute.mockClear()
  expect(() =>
    createDialectProvider(Dialect.Postgres, {
      connectionString: 'postgres://user@localhost/db',
      resourceId: 'resource',
    }).execute({ query: 'SELECT 1', values: [] })
  ).toThrow('Enter the password to query')
  expect(execute).not.toHaveBeenCalled()
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

test('the web app never sends an SSH connection string to a proxy', () => {
  execute.mockClear()
  cloudExecute.mockClear()
  expect(() =>
    createDialectProvider(Dialect.Postgres, {
      connectionString:
        'postgres://user:password@db.internal/db?ssh_host=bastion&ssh_auth=key&ssh_key=secret',
    }).execute({ query: 'SELECT 1', values: [] })
  ).toThrow('SSH tunnels run in the Tamery desktop app')
  expect(execute).not.toHaveBeenCalled()
  expect(cloudExecute).not.toHaveBeenCalled()
})
