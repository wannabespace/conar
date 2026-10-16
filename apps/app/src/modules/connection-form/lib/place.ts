import type { ServerField } from '@tamery/connection/guess/types'
import type { SqliteLocation } from '@tamery/shared/enums/connection-type'
import { ConnectionType, Dialect } from '@tamery/shared/enums/connection-type'

export type Place = SqliteLocation | 'server'

export const getPlace = ({
  sqliteLocation,
  type,
}: {
  sqliteLocation: SqliteLocation
  type: ConnectionType
}): Place => (type === ConnectionType.SQLite ? sqliteLocation : 'server')

interface PlaceRow {
  label: string
  name: Exclude<ServerField, 'port'> | 'options'
  /** Left out of what a paste says is still missing. */
  optional?: true
  placeholder?: string | Partial<Record<Dialect, string>>
  /** Shows the port beside it, which saves the port too. */
  port?: true
  secret?: true
}

interface PlaceSpec {
  /** Names where the database is: required, read whole on blur like a paste, focused when an edit opens. */
  field: 'database' | 'host'
  message: string
  rows: PlaceRow[]
}

/** Only the fields a place's rows show are saved, so nothing the form hides reaches the string. */
export const PLACES: Record<Place, PlaceSpec> = {
  d1: {
    field: 'database',
    message: 'Enter the database ID',
    rows: [
      {
        label: 'Account ID',
        name: 'user',
        placeholder: 'In the dashboard URL, after dash.cloudflare.com/',
      },
      {
        label: 'Database ID',
        name: 'database',
        placeholder: "Or paste the database's dashboard link",
      },
      {
        label: 'API token',
        name: 'password',
        placeholder: 'With D1 Edit permission',
        secret: true,
      },
    ],
  },
  file: {
    field: 'database',
    message: 'Choose the database file',
    rows: [{ label: 'File', name: 'database', placeholder: '/path/to/app.db' }],
  },
  libsql: {
    field: 'host',
    message: 'Enter the host',
    rows: [
      {
        label: 'Host',
        name: 'host',
        placeholder: 'my-db-org.turso.io or its libsql:// URL',
        port: true,
      },
      {
        label: 'Auth token',
        name: 'password',
        placeholder: 'None',
        secret: true,
      },
      {
        label: 'Options',
        name: 'options',
        optional: true,
        placeholder: 'e.g. tls=0',
      },
    ],
  },
  server: {
    field: 'host',
    message: 'Enter the host',
    rows: [
      {
        label: 'Host',
        name: 'host',
        placeholder: 'db.example.com or any connection string',
        port: true,
      },
      {
        label: 'User',
        name: 'user',
        placeholder: {
          [Dialect.ClickHouse]: 'default',
          [Dialect.MSSQL]: 'e.g. sa',
          [Dialect.MySQL]: 'e.g. root',
          [Dialect.Postgres]: 'e.g. postgres',
        },
      },
      {
        label: 'Password',
        name: 'password',
        placeholder: 'None',
        secret: true,
      },
      {
        label: 'Database',
        name: 'database',
        optional: true,
        placeholder: {
          [Dialect.ClickHouse]: 'default',
          [Dialect.MSSQL]: 'master',
          [Dialect.MySQL]: 'Optional',
          [Dialect.Postgres]: 'postgres',
        },
      },
      {
        label: 'Options',
        name: 'options',
        optional: true,
        placeholder: {
          [Dialect.MSSQL]: 'e.g. encrypt=true',
          [Dialect.MySQL]: 'e.g. ssl=true',
          [Dialect.Postgres]: 'e.g. sslmode=require',
        },
      },
    ],
  },
}

/** A row's label as it reads mid-sentence: `Account ID` becomes `account ID`, but `API token` keeps its capitals. */
export const getFieldNoun = (place: Place, field: string) =>
  (
    PLACES[place].rows.find((row) => row.name === field)?.label ?? field
  ).replace(/^[A-Z](?=[a-z])/u, (letter) => letter.toLowerCase())
