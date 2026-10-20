import { describe, expect, test } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { connectionParts } from './connection-parts'
import { databaseFile } from './database-file'
import { describeConnectionString, resourceConnectionString } from './utils'

describe('databaseFile', () => {
  test.each([
    '/Users/me/app data.db',
    '/tmp/a#b?c%d.sqlite',
    'C:/Users/me/app.db',
    '~/data/app.db',
  ])('reads %p back from its string', (path) => {
    expect(
      databaseFile.path(
        databaseFile.connectionString(ConnectionType.SQLite, path)
      )
    ).toBe(path)
  })

  test('takes a Windows path with backslashes', () => {
    expect(
      databaseFile.path(
        databaseFile.connectionString(
          ConnectionType.SQLite,
          String.raw`C:\data\app.db`
        )
      )
    ).toBe('C:/data/app.db')
  })

  test('drops the spaces a copied path carries', () => {
    expect(
      databaseFile.path(
        databaseFile.connectionString(ConnectionType.SQLite, ' /srv/app.db \n')
      )
    ).toBe('/srv/app.db')
  })

  test('round-trips through the form parts', () => {
    const connectionString = databaseFile.connectionString(
      ConnectionType.SQLite,
      '/srv/app.db'
    )
    const parts = connectionParts.parse(connectionString)

    expect(parts).toMatchObject({
      database: '/srv/app.db',
      host: '',
      type: ConnectionType.SQLite,
    })
    expect(connectionParts.format(parts)).toBe(connectionString)
  })

  test('round-trips a DuckDB file through the form parts', () => {
    const connectionString = databaseFile.connectionString(
      ConnectionType.DuckDB,
      '/srv/analytics.duckdb'
    )

    expect(connectionString).toBe('duckdb:///srv/analytics.duckdb')
    expect(connectionParts.parse(connectionString)).toMatchObject({
      database: '/srv/analytics.duckdb',
      host: '',
      provider: null,
      type: ConnectionType.DuckDB,
    })
    expect(
      connectionParts.format(connectionParts.parse(connectionString))
    ).toBe(connectionString)
  })

  test('keeps its string for the resource and shows the file name', () => {
    const connectionString = databaseFile.connectionString(
      ConnectionType.SQLite,
      '/srv/app.db'
    )

    expect(resourceConnectionString(connectionString, 'main')).toBe(
      connectionString
    )
    expect(describeConnectionString(connectionString)).toMatchObject({
      defaultResourceName: 'main',
      displayUrl: 'app.db',
      isInternal: true,
    })
  })
})
