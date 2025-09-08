import type { DatabaseType } from '@conar/shared/enums/database-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { orpc } from '~/lib/orpc'
import { databasesCollection } from './sync'

export async function createDatabase({ saveInCloud, ...database }: {
  name: string
  type: DatabaseType
  connectionString: string
  saveInCloud: boolean
}) {
  const url = new SafeURL(database.connectionString.trim())

  const isPasswordExists = !!url.password

  if (isPasswordExists && !saveInCloud) {
    url.password = ''
  }

  const db = await orpc.databases.create({
    ...database,
    connectionString: url.toString(),
    isPasswordExists,
  })

  databasesCollection.insert({ ...db, isPasswordPopulated: isPasswordExists })

  return db
}

export async function removeDatabase(id: string) {
  await orpc.databases.remove({ id })
  databasesCollection.delete(id)
}

export async function renameDatabase(id: string, name: string) {
  const existing = databasesCollection.get(id)

  if (!existing) {
    throw new Error('Database not found')
  }

  await orpc.databases.update({ id, name })

  databasesCollection.update(id, (draft) => {
    draft.name = name
  })
}

export async function updateDatabasePassword(id: string, password: string) {
  const database = databasesCollection.get(id)

  if (!database) {
    throw new Error('Database not found')
  }

  const url = new SafeURL(database.connectionString)

  url.password = password

  databasesCollection.update(id, (draft) => {
    draft.connectionString = url.toString()
    draft.isPasswordPopulated = true
  })
}
