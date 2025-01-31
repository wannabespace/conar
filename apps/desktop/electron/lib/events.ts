import { decrypt, encrypt } from '@connnect/shared/encryption'
import { ipcMain } from 'electron'
import ElectronStore from 'electron-store'
import pg from 'pg'

type Store = 'databases'

const storeMap = new Map<Store, ElectronStore>()

function createStore(store: Store) {
  return new ElectronStore({
    name: `.${store}`,
    encryptionKey: import.meta.env.VITE_PUBLIC_ELECTRON_STORE_SECRET,
    fileExtension: 'json',
  })
}

const store = {
  get: <T>(store: Store, key: string) => {
    if (!storeMap.has(store)) {
      storeMap.set(store, createStore(store))
    }

    return storeMap.get(store)!.get(key) as T | null
  },
  set: <T>(store: Store, key: string, value: T) => {
    if (!storeMap.has(store)) {
      storeMap.set(store, createStore(store))
    }

    storeMap.get(store)!.set(key, value)
  },
  delete: (store: Store, key: string) => {
    if (!storeMap.has(store)) {
      storeMap.set(store, createStore(store))
    }

    storeMap.get(store)!.delete(key)
  },
}

const encryption = {
  encrypt: async ({ text, secret }: { text: string, secret: string }) => {
    const encryptedSecret = await encrypt({ text: secret, secret: import.meta.env.VITE_PUBLIC_ELECTRON_LOCAL_SECRET })

    return encrypt({ text, secret: encryptedSecret })
  },
  decrypt: async ({ encryptedText, secret }: { encryptedText: string, secret: string }) => {
    const encryptedSecret = await encrypt({ text: secret, secret: import.meta.env.VITE_PUBLIC_ELECTRON_LOCAL_SECRET })

    return decrypt({ encryptedText, secret: encryptedSecret })
  },
}

const databases = {
  postgresQuery: async <T>({
    connection,
    query,
    values,
  }: {
    connection: {
      host: string
      port: number
      user: string
      password: string
      database: string
    } | string
    query: string
    values?: string[]
  }) => {
    const client = new pg.Client(connection)

    try {
      await client.connect()

      const result = await client.query(query, values)

      console.log('result', result)

      return {
        rows: result.rows as T[],
        columns: result.fields.map(field => ({
          ...field,
        })),
      }
    }
    finally {
      await client.end()
    }
  },
}

export const electron = {
  databases,
  encryption,
  store,
}

export function initElectronEvents() {
  for (const events of Object.values(electron)) {
    for (const [key, handler] of Object.entries(events)) {
      ipcMain.handle(key, (event, arg) => handler(arg))
    }
  }
}
