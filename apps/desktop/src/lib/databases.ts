interface Database {
  id: string
  host: string
  port: number
  username: string
  encryptedPassword: string
  database: string
}

export async function saveDatabase(database: Database) {
  window.electron.store.set({ store: 'databases', key: database.id, value: database })
}

export async function deleteDatabase(id: string) {
  window.electron.store.delete({ store: 'databases', key: id })
}

export async function getDatabase(id: string) {
  return window.electron.store.get<Database>({ store: 'databases', key: id })
}
