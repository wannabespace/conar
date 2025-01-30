interface Database {
  id: string
  host: string
  port: number
  username: string
  encryptedPassword: string
  database: string
}

export async function saveDatabase(database: Database) {
  window.electron.store.set('databases', database.id, database)
}

export async function deleteDatabase(id: string) {
  window.electron.store.delete('databases', id)
}

export async function getDatabase(id: string) {
  return window.electron.store.get<Database>('databases', id)
}
