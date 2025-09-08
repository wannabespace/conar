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
