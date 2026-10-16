import type { ConnectionParts } from '@tamery/connection/connection-parts'
import type { ServerField } from '@tamery/connection/guess/types'
import type { SqliteLocation } from '@tamery/connection/sqlite-remote'
import { D1_HOST } from '@tamery/connection/sqlite-remote'
import { ConnectionType } from '@tamery/shared/enums/connection-type'

export interface Place {
  sqliteLocation: SqliteLocation
  type: ConnectionType
}

export const opensFile = ({ sqliteLocation, type }: Place) =>
  type === ConnectionType.SQLite && sqliteLocation === 'file'

/** The field that names where the database is: a SQLite file or D1 database ID, every other host. */
export const getPlaceField = (place: Place) =>
  place.type === ConnectionType.SQLite && place.sqliteLocation !== 'libsql'
    ? 'database'
    : 'host'

const PLACE_MESSAGES: Record<SqliteLocation, string> = {
  d1: 'Enter the database ID',
  file: 'Choose the database file',
  libsql: 'Enter the database URL',
}

export const getPlaceMessage = (place: Place) =>
  place.type === ConnectionType.SQLite
    ? PLACE_MESSAGES[place.sqliteLocation]
    : 'Enter the host'

const FIELD_LABELS: Record<
  SqliteLocation,
  Partial<Record<ServerField, string>>
> = {
  d1: { database: 'database ID', password: 'API token', user: 'account ID' },
  file: {},
  libsql: { host: 'database URL', password: 'auth token' },
}

/** How a missing field is named in a sentence, which a remote SQLite location spells its own way. */
export const getFieldLabel = (place: Place, field: ServerField) =>
  (place.type === ConnectionType.SQLite &&
    FIELD_LABELS[place.sqliteLocation][field]) ||
  field

/** Fields beside the place that a SQLite location still needs to connect. */
export const SQLITE_NEEDED: Record<SqliteLocation, ServerField[]> = {
  d1: ['user', 'password'],
  file: [],
  libsql: ['password'],
}

const SQLITE_FIELDS: Record<SqliteLocation, ServerField[]> = {
  d1: ['database', 'password', 'user'],
  file: ['database'],
  libsql: ['host', 'password', 'port'],
}

/** Keeps only what the location reads, so a host left over from another engine never turns a file into a server. */
export const getSqliteParts = (
  parts: ConnectionParts,
  sqliteLocation: SqliteLocation
): ConnectionParts => {
  const keep = (field: ServerField) =>
    SQLITE_FIELDS[sqliteLocation].includes(field) ? parts[field] : ''
  return {
    database: keep('database'),
    host: sqliteLocation === 'd1' ? D1_HOST : keep('host'),
    https: null,
    options: sqliteLocation === 'file' ? '' : parts.options,
    password: keep('password'),
    port: keep('port'),
    ssh: null,
    type: ConnectionType.SQLite,
    user: keep('user'),
  }
}
