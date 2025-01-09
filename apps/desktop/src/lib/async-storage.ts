import type { AsyncStorage } from '@tanstack/react-query-persist-client'
import type { Store } from '@tauri-apps/plugin-store'
import { load } from '@tauri-apps/plugin-store'

function loadStore() {
  return load('.cache.dat')
}

let store: Store

export const asyncStorage = {
  getItem: async (key: string) => {
    store ||= await loadStore()

    return store.get(key)
  },
  setItem: async (key: string, value: string) => {
    store ||= await loadStore()

    await store.set(key, value)
  },
  removeItem: async (key: string) => {
    store ||= await loadStore()

    await store.delete(key)
  },
} satisfies AsyncStorage
