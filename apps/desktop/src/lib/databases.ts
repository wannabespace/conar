import { load } from '@tauri-apps/plugin-store'
import { createEncryptor } from './secrets'

interface Database {
  id: string
  host: string
  port: number
  username: string
  encryptedPassword: string
  database: string
}

function loadStore() {
  return load('.databases.dat')
}

export async function saveDatabase(database: Database, secret: string) {
  const encryptor = await createEncryptor(secret)
  const store = await loadStore()
  const encrypted = await encryptor.encrypt(JSON.stringify(database))

  await store.set(database.id, encrypted)
}

export async function deleteDatabase(id: string) {
  const store = await loadStore()

  await store.delete(id)
}

export async function getDatabase(id: string, secret: string) {
  const store = await loadStore()
  const encrypted = await store.get<string>(id)

  if (!encrypted) {
    return null
  }

  const encryptor = await createEncryptor(secret)

  return JSON.parse(await encryptor.decrypt(encrypted)) as Database
}
