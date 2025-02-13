import type { DatabaseCredentials } from '@connnect/shared/types/database'
import { decrypt, encrypt } from '@connnect/shared/encryption'
import { DatabaseType } from '@connnect/shared/enums/database-type'
import { ipcMain } from 'electron'
import ElectronStore from 'electron-store'
import { pgQuery, pgTestConnection } from './pg'

type Store = 'databases'

const storeMap = new Map<Store, ElectronStore>()

function createStore(store: Store) {
  return new ElectronStore({
    name: `.${store}`,
    encryptionKey: import.meta.env.VITE_PUBLIC_ELECTRON_STORE_SECRET,
    fileExtension: 'dat',
  })
}

function getStore(store: Store) {
  if (!storeMap.has(store)) {
    storeMap.set(store, createStore(store))
  }

  return storeMap.get(store)!
}

const store = {
  get: ({ store, key }: { store: Store, key: string }) => {
    return getStore(store).get(key)
  },
  set: ({ store, key, value }: { store: Store, key: string, value: unknown }) => {
    getStore(store).set(key, value)
  },
  delete: ({ store, key }: { store: Store, key: string }) => {
    getStore(store).delete(key)
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
  query: async <T>({
    type,
    credentials,
    query,
    values,
  }: {
    type: DatabaseType
    credentials: DatabaseCredentials
    query: string
    values?: string[]
  }) => {
    const queryMap = {
      [DatabaseType.Postgres]: pgQuery,
    }

    return queryMap[type]({ credentials, query, values }) as Promise<T[]>
  },
  testConnection: async ({
    type,
    credentials,
  }: {
    type: DatabaseType
    credentials: DatabaseCredentials
  }) => {
    const queryMap = {
      [DatabaseType.Postgres]: pgTestConnection,
    }

    return queryMap[type]({ credentials })
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
