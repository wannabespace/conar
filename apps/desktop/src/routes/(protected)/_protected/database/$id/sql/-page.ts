import { Store } from '@tanstack/react-store'
import { createHooks } from 'hookable'

interface PageStoreState {
  sql: string
  queriesToRun: string[]
  selectedLines: number[]
  files: File[]
}

const defaultState: PageStoreState = {
  sql: [
    '-- Write your SQL query here based on your database schema',
    '-- The examples below are for reference only and may not work with your database',
    '',
    '-- Example: Basic query with limit',
    'SELECT * FROM users LIMIT 10;',
    '',
    '-- Example: Query with filtering',
    'SELECT id, name, email FROM users WHERE created_at > \'2025-01-01\' ORDER BY name;',
    '',
    '-- Example: Join example',
    'SELECT u.id, u.name, p.title FROM users u',
    'JOIN posts p ON u.id = p.user_id',
    'WHERE p.published = true',
    'LIMIT 10;',
  ].join('\n'),
  queriesToRun: [],
  selectedLines: [],
  files: [],
}

const storesMap = new Map<string, Store<PageStoreState>>()

export function pageStore(id: string) {
  if (storesMap.has(id)) {
    return storesMap.get(id)!
  }

  const store = new Store<PageStoreState>(Object.assign(
    defaultState,
    JSON.parse(localStorage.getItem(`sql-page-${id}`) || '{}'),
  ))

  storesMap.set(id, store)

  store.subscribe(({ currentVal }) => {
    localStorage.setItem(`sql-page-${id}`, JSON.stringify({
      sql: currentVal.sql,
      selectedLines: currentVal.selectedLines,
    }))
  })

  return store
}

export const pageHooks = createHooks<{
  fix: (error: string) => Promise<void>
  sendMessage: () => void
  focusRunner: () => void
}>()
