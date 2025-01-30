import Store from 'electron-store'

import { env } from '~/env'
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
  return new Store({ name: 'databases', encryptionKey: env.VITE_PUBLIC_STORE_SECRET })
}

export async function saveDatabase(database: Database, secret: string) {
  const encryptor = await createEncryptor(secret)
  const store = loadStore()
  const encrypted = await encryptor.encrypt(JSON.stringify(database))

  store.set(database.id, encrypted)
}

export async function deleteDatabase(id: string) {
  const store = loadStore()

  store.delete(id)
}

export async function getDatabase(id: string, secret: string) {
  const store = loadStore()
  const encrypted = store.get(id) as string

  if (!encrypted) {
    return null
  }

  const encryptor = await createEncryptor(secret)

  const decrypted = await encryptor.decrypt(encrypted)

  if (!decrypted) {
    return null
  }

  return JSON.parse(decrypted) as Database
}
