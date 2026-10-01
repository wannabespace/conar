import { toast } from 'sonner'

import { removeTab, replaceTabId } from '~/core/tabs/actions'
import { tableTabId } from '~/core/tabs/ids'

import { navigatorStore } from './stores'

const MAX_PINNED_TABLES = 10

export const pinnedTable = {
  cleanup: (id: string, tables: { schema: string; table: string }[]) => {
    const store = navigatorStore(id)

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
  },
  remove: (id: string, schema: string, table: string) => {
    const store = navigatorStore(id)

    removeTab(id, tableTabId(schema, table))

    store.set(
      (state) =>
        ({
          ...state,
          pinnedTables: state.pinnedTables.filter(
            (pinned) => pinned.table !== table || pinned.schema !== schema
          ),
        }) satisfies typeof state
    )
  },
  rename: (id: string, schema: string, table: string, newTableName: string) => {
    const store = navigatorStore(id)

    replaceTabId(
      id,
      tableTabId(schema, table),
      tableTabId(schema, newTableName)
    )

    store.set(
      (state) =>
        ({
          ...state,
          pinnedTables: state.pinnedTables.map((pinned) =>
            pinned.table === table && pinned.schema === schema
              ? { ...pinned, table: newTableName }
              : pinned
          ),
        }) satisfies typeof state
    )
  },
  toggle: (id: string, schema: string, table: string) => {
    const store = navigatorStore(id)

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
  },
}
