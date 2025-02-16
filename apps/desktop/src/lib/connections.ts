import type { Connection } from '@connnect/shared/types/connection'

export async function saveConnection(id: string, connection: Connection) {
  window.electron.store.set({ store: 'connections', key: id, value: connection })
}

export async function deleteConnection(id: string) {
  window.electron.store.delete({ store: 'connections', key: id })
}

export async function getConnection(id: string) {
  return window.electron.store.get({ store: 'connections', key: id }) as Promise<Connection | null>
}
