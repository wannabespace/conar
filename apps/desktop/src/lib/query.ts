import type { DatabaseType } from '@conar/shared/enums/database-type'

export function dbQuery(params: {
  type: DatabaseType
  connectionString: string
  query: string
  values?: unknown[]
}) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  return window.electron.databases.query(params)
}

export function dbTestConnection(params: {
  type: DatabaseType
  connectionString: string
}) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  return window.electron.databases.test(params)
}
