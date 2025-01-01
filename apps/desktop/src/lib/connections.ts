import { load } from '@tauri-apps/plugin-store'
import { secretParse, secretStringify } from './secrets'

interface Connection {
  id: string
  host: string
  port: number
  username: string
  password: string
  database: string
}

function loadStore() {
  return load('.connections.dat')
}

export async function getConnectionsIds() {
  const store = await loadStore()

  return store.keys()
}

export async function saveConnection(connection: Connection, secret: string) {
  const store = await loadStore()
  const encrypted = await secretStringify(connection, secret)

  await store.set(connection.id, encrypted)
}

export async function deleteConnection(id: string) {
  const store = await loadStore()

  await store.delete(id)
}

export async function getConnection(id: string, secret: string) {
  const store = await loadStore()
  const encrypted = await store.get<string>(id)

  if (!encrypted) {
    return null
  }

  return secretParse<Connection>(encrypted, secret)
}
