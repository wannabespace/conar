import type { DatabaseCredentials } from '@connnect/shared/types/database'

export async function saveDatabase(id: string, database: DatabaseCredentials) {
  window.electron.store.set({ store: 'databases', key: id, value: database })
}

export async function deleteDatabase(id: string) {
  window.electron.store.delete({ store: 'databases', key: id })
}

export async function getDatabase(id: string) {
  return window.electron.store.get({ store: 'databases', key: id }) as Promise<DatabaseCredentials | null>
}
