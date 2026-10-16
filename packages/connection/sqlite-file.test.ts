import { describe, expect, test } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { connectionParts } from './connection-parts'
import { sqliteFile } from './sqlite-file'
import { describeConnectionString, resourceConnectionString } from './utils'

describe('sqliteFile', () => {
  test.each([
    '/Users/me/app data.db',
    '/tmp/a#b?c%d.sqlite',
    'C:/Users/me/app.db',
    '~/data/app.db',
  ])('reads %p back from its string', (path) => {
    expect(sqliteFile.path(sqliteFile.connectionString(path))).toBe(path)
  })

  test('takes a Windows path with backslashes', () => {
    expect(
      sqliteFile.path(sqliteFile.connectionString(String.raw`C:\data\app.db`))
    ).toBe('C:/data/app.db')
  })

  test('drops the spaces a copied path carries', () => {
    expect(
      sqliteFile.path(sqliteFile.connectionString(' /srv/app.db \n'))
    ).toBe('/srv/app.db')
  })

  test('round-trips through the form parts', () => {
    const connectionString = sqliteFile.connectionString('/srv/app.db')
    const parts = connectionParts.parse(connectionString)

    expect(parts).toMatchObject({
      database: '/srv/app.db',
      host: '',
      type: ConnectionType.SQLite,
    })
    expect(connectionParts.format(parts)).toBe(connectionString)
  })

  test('keeps its string for the resource and shows the file name', () => {
    const connectionString = sqliteFile.connectionString('/srv/app.db')

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
