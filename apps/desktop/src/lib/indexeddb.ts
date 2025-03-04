import type { ConnectionType } from '@connnect/shared/enums/connection-type'
import type { EntityTable } from 'dexie'
import Dexie from 'dexie'

export interface Connection {
  id: string
  name: string
  type: ConnectionType
  createdAt: Date
  connectionString: string
  isPasswordExists: boolean
  isPasswordPopulated: boolean
}

export const indexedDb = new Dexie('connnect') as Dexie & {
  connections: EntityTable<Connection, 'id'>
}

indexedDb.version(1).stores({
  connections: '++id, name, type, connectionString, isPasswordExists, isPasswordPopulated, createdAt',
})
