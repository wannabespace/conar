import type { Client } from '@tauri-apps/plugin-stronghold'
import { appDataDir } from '@tauri-apps/api/path'
import { Stronghold } from '@tauri-apps/plugin-stronghold'

let stronghold: Stronghold | null = null
let client: Client | null = null

async function initStronghold() {
  if (stronghold && client) {
    return {
      stronghold,
      client,
    }
  }

  const vaultPath = `${await appDataDir()}/vault.hold`
  const vaultPassword = import.meta.env.VITE_STRONGHOLD_PASSWORD

  stronghold = await Stronghold.load(vaultPath, vaultPassword)

  const clientName = 'connnect'

  try {
    client = await stronghold.loadClient(clientName)
  }
  catch {
    client = await stronghold.createClient(clientName)
  }

  return {
    stronghold,
    client,
  }
}

export async function insertRecord(key: string, value: string) {
  const { client } = await initStronghold()
  const store = client.getStore()

  const data = Array.from(new TextEncoder().encode(value))
  await store.insert(key, data)
}

export async function getRecord(key: string) {
  const { client } = await initStronghold()
  const store = client.getStore()

  const data = await store.get(key)

  if (!data)
    return null

  return new TextDecoder().decode(new Uint8Array(data))
}

export async function removeRecord(key: string) {
  const { client } = await initStronghold()
  const store = client.getStore()

  await store.remove(key)
}
