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
    fileExtension: 'dat',
  })
}

const store = {
  get: ({ store, key }: { store: Store, key: string }) => {
    if (!storeMap.has(store)) {
      storeMap.set(store, createStore(store))
    }

    return storeMap.get(store)!.get(key)
  },
  set: ({ store, key, value }: { store: Store, key: string, value: unknown }) => {
    if (!storeMap.has(store)) {
      storeMap.set(store, createStore(store))
    }

    storeMap.get(store)!.set(key, value)
  },
  delete: ({ store, key }: { store: Store, key: string }) => {
    if (!storeMap.has(store)) {
      storeMap.set(store, createStore(store))
    }

    storeMap.get(store)!.delete(key)
  },
}

const encryption = {
  encrypt: ({ text, secret }: { text: string, secret: string }) => {
    return encrypt({ text, secret: secret + import.meta.env.VITE_PUBLIC_ELECTRON_LOCAL_SECRET })
  },
  decrypt: ({ encryptedText, secret }: { encryptedText: string, secret: string }) => {
    return decrypt({ encryptedText, secret: secret + import.meta.env.VITE_PUBLIC_ELECTRON_LOCAL_SECRET })
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
      database?: string
    }
    query: string
    values?: string[]
  }) => {
    const pool = new pg.Pool(connection)

    try {
      const result = await pool.query(query, values)

      console.log('result', result)

      return result.rows as T[]
    }
    finally {
      await pool.end()
    }
  },
}

const _app = {

}

export const electron = {
  databases,
  encryption,
  store,
  app: _app,
}

export function initElectronEvents() {
  for (const events of Object.values(electron)) {
    for (const [key, handler] of Object.entries(events)) {
      ipcMain.handle(key, (event, arg) => handler(arg))
    }
  }
}
