import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { EntityTable } from 'dexie'
import Dexie from 'dexie'

export interface Database {
  id: string
  name: string
  type: DatabaseType
  createdAt: Date
  connectionString: string
  isPasswordExists: boolean
  isPasswordPopulated: boolean
}

export const indexedDb = new Dexie('connnect') as Dexie & {
  databases: EntityTable<Database, 'id'>
}

indexedDb.version(1).stores({
  databases: '++id, name, type, connectionString, isPasswordExists, isPasswordPopulated, createdAt',
})
