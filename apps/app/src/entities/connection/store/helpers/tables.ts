import { toast } from 'sonner'

import { getConnectionResourceStore } from '..'
import { tableTabId } from '../tabs/ids'

const MAX_PINNED_TABLES = 10

export const renameTableTab = (
  id: string,
  schema: string,
  table: string,
  newTableName: string
) => {
  const store = getConnectionResourceStore(id)

  store.set(
    (state) =>
      ({
        ...state,
        pinnedTables: state.pinnedTables.map((pinned) =>
          pinned.table === table && pinned.schema === schema
            ? { ...pinned, table: newTableName }
            : pinned
        ),
        tabs: state.tabs.map((tab) =>
          tab.type === 'table' && tab.table === table && tab.schema === schema
            ? {
                ...tab,
                id: tableTabId(schema, newTableName),
                table: newTableName,
              }
            : tab
        ),
      }) satisfies typeof state
  )
}

export const removeTableTab = (id: string, schema: string, table: string) => {
  const store = getConnectionResourceStore(id)

  store.set(
    (state) =>
      ({
        ...state,
        pinnedTables: state.pinnedTables.filter(
          (pinned) => pinned.table !== table || pinned.schema !== schema
        ),
        tabs: state.tabs.filter((tab) => tab.id !== tableTabId(schema, table)),
      }) satisfies typeof state
  )
}

export const togglePinTable = (id: string, schema: string, table: string) => {
  const store = getConnectionResourceStore(id)

  store.set((state) => {
    const isPinned = state.pinnedTables.some(
      (t) => t.schema === schema && t.table === table
    )

    if (isPinned) {
      return {
        ...state,
        pinnedTables: state.pinnedTables.filter(
          (t) => !(t.schema === schema && t.table === table)
        ),
      } satisfies typeof state
    }

    if (state.pinnedTables.length >= MAX_PINNED_TABLES) {
      toast.info(
        `Only ${MAX_PINNED_TABLES} tables can be pinned. Last pinned table removed.`
      )
    }

    return {
      ...state,
      pinnedTables: [{ schema, table }, ...state.pinnedTables].slice(
        0,
        MAX_PINNED_TABLES
      ),
    } satisfies typeof state
  })
}

export const cleanupPinnedTables = (
  id: string,
  tables: { schema: string; table: string }[]
) => {
  const store = getConnectionResourceStore(id)

  store.set((state) => {
    const tablesSet = new Set(tables.map((t) => `${t.schema}:${t.table}`))

    const pinnedTables = state.pinnedTables.filter((t) =>
      tablesSet.has(`${t.schema}:${t.table}`)
    )

    if (pinnedTables.length !== state.pinnedTables.length) {
      return {
        ...state,
        pinnedTables,
      } satisfies typeof state
    }

    return state
  })
}
