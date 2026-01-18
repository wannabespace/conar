import type { databaseStoreType } from '.'
import { toast } from 'sonner'
import { databaseStore } from '.'

export function addTab(id: string, schema: string, table: string, preview?: boolean) {
  const store = databaseStore(id)

  if (preview) {
    const existingPreviewTabIndex = store.state.tabs.findIndex(tab => tab.preview)

    if (existingPreviewTabIndex !== -1) {
      store.setState(prev => ({
        ...prev,
        tabs: prev.tabs.map((tab, index) => index === existingPreviewTabIndex ? { table, schema, preview: true } : tab) ?? [],
      } satisfies typeof prev))
      return
    }

    store.setState(prev => ({
      ...prev,
      tabs: [...prev.tabs, { table, schema, preview: true }],
    } satisfies typeof prev))
    return
  }

  if (!store.state.tabs.find(tab => tab.table === table && tab.schema === schema && !tab.preview)) {
    store.setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab => tab.table === table && tab.schema === schema ? { table, schema, preview: false } : tab) ?? [],
    } satisfies typeof prev))
  }
}

export function renameTab(id: string, schema: string, table: string, newTableName: string) {
  const store = databaseStore(id)

  const rename = <T extends { table: string, schema: string }>(tab: T) =>
    tab.table === table && tab.schema === schema ? { ...tab, table: newTableName } : tab

  store.setState(prev => ({
    ...prev,
    tabs: prev.tabs.map(rename),
    pinnedTables: prev.pinnedTables.map(rename),
  } satisfies typeof prev))
}

export function removeTab(id: string, schema: string, table: string) {
  const store = databaseStore(id)

  const remove = <T extends { table: string, schema: string }>(tab: T) =>
    tab.table !== table || tab.schema !== schema

  store.setState(prev => ({
    ...prev,
    tabs: prev.tabs.filter(remove) ?? [],
    pinnedTables: prev.pinnedTables.filter(remove),
  } satisfies typeof prev))
}

export function updateTabs(id: string, newTabs: typeof databaseStoreType.infer['tabs']) {
  const store = databaseStore(id)

  store.setState(state => ({
    ...state,
    tabs: newTabs,
  } satisfies typeof state))
}

const MAX_PINNED_TABLES = 10

export function togglePinTable(id: string, schema: string, table: string) {
  const store = databaseStore(id)

  store.setState((state) => {
    const isPinned = state.pinnedTables.some(
      t => t.schema === schema && t.table === table,
    )

    if (isPinned) {
      return {
        ...state,
        pinnedTables: state.pinnedTables.filter(t => !(t.schema === schema && t.table === table)),
      } satisfies typeof state
    }

    if (state.pinnedTables.length >= MAX_PINNED_TABLES) {
      toast.info(`Only ${MAX_PINNED_TABLES} tables can be pinned. Last pinned table removed.`)
    }

    return {
      ...state,
      pinnedTables: [{ schema, table }, ...state.pinnedTables].slice(0, MAX_PINNED_TABLES),
    } satisfies typeof state
  })
}

export function cleanupPinnedTables(
  id: string,
  tables: { schema: string, table: string }[],
) {
  const store = databaseStore(id)

  store.setState((state) => {
    const tablesSet = new Set(tables.map(t => `${t.schema}:${t.table}`))

    const pinnedTables = state.pinnedTables.filter(t => tablesSet.has(`${t.schema}:${t.table}`))

    if (pinnedTables.length !== state.pinnedTables.length) {
      return {
        ...state,
        pinnedTables,
      } satisfies typeof state
    }

    return state
  })
}

export function toggleChat(id: string, isVisible?: boolean) {
  const store = databaseStore(id)
  store.setState(state => ({
    ...state,
    layout: {
      ...state.layout,
      chatVisible: isVisible ?? !state.layout.chatVisible,
    },
  } satisfies typeof state))
}

export function toggleResults(id: string) {
  const store = databaseStore(id)
  store.setState(state => ({
    ...state,
    layout: {
      ...state.layout,
      resultsVisible: !state.layout.resultsVisible,
    },
  } satisfies typeof state))
}

export function setChatPosition(id: string, position: typeof databaseStoreType.infer['layout']['chatPosition']) {
  const store = databaseStore(id)
  store.setState(state => ({
    ...state,
    layout: {
      ...state.layout,
      chatPosition: position,
    },
  } satisfies typeof state))
}

export function toggleFolder(id: string, schema: string, folder: string) {
  const store = databaseStore(id)
  store.setState((state) => {
    const key = `${schema}:${folder}`
    const isOpen = state.tablesTreeOpenedFolders.some(f => `${f.schema}:${f.folder}` === key)

    return {
      ...state,
      tablesTreeOpenedFolders: isOpen
        ? state.tablesTreeOpenedFolders.filter(f => `${f.schema}:${f.folder}` !== key)
        : [...state.tablesTreeOpenedFolders, { schema, folder }],
    } satisfies typeof state
  })
}

export function addTableToFolder(id: string, schema: string, folder: string, table: string) {
  const store = databaseStore(id)
  store.setState((state) => {
    // First, remove the table from any other folder in the same schema
    const updatedFolders = state.tableFolders
      .map(g =>
        g.schema === schema && g.tables.includes(table)
          ? { ...g, tables: g.tables.filter(t => t !== table) }
          : g,
      )
      .filter(g => g.tables.length > 0)

    const existingFolder = updatedFolders.find(g => g.schema === schema && g.folder === folder)

    if (existingFolder) {
      if (existingFolder.tables.includes(table)) {
        return state
      }

      return {
        ...state,
        tableFolders: updatedFolders.map(g =>
          g.schema === schema && g.folder === folder
            ? { ...g, tables: [...g.tables, table] }
            : g,
        ),
      } satisfies typeof state
    }

    return {
      ...state,
      tableFolders: [...updatedFolders, { schema, folder, tables: [table] }],
    } satisfies typeof state
  })
}

export function removeTableFromFolder(id: string, schema: string, folder: string, table: string) {
  const store = databaseStore(id)
  store.setState(state => ({
    ...state,
    tableFolders: state.tableFolders
      .map(g =>
        g.schema === schema && g.folder === folder
          ? { ...g, tables: g.tables.filter(t => t !== table) }
          : g,
      )
      .filter(g => g.tables.length > 0),
  } satisfies typeof state))
}

export function folderExists(id: string, schema: string, folder: string): boolean {
  const store = databaseStore(id)
  return store.state.tableFolders.some(g => g.schema === schema && g.folder === folder)
}

export function renameFolder(id: string, schema: string, oldFolder: string, newFolder: string): boolean {
  const store = databaseStore(id)

  // Check if a folder with the new name already exists
  if (folderExists(id, schema, newFolder)) {
    return false
  }

  store.setState(state => ({
    ...state,
    tableFolders: state.tableFolders.map(g =>
      g.schema === schema && g.folder === oldFolder
        ? { ...g, folder: newFolder }
        : g,
    ),
    tablesTreeOpenedFolders: state.tablesTreeOpenedFolders.map(f =>
      f.schema === schema && f.folder === oldFolder
        ? { schema, folder: newFolder }
        : f,
    ),
  } satisfies typeof state))

  return true
}

export function deleteFolder(id: string, schema: string, folder: string) {
  const store = databaseStore(id)
  store.setState(state => ({
    ...state,
    tableFolders: state.tableFolders.filter(g => !(g.schema === schema && g.folder === folder)),
    tablesTreeOpenedFolders: state.tablesTreeOpenedFolders.filter(f => !(f.schema === schema && f.folder === folder)),
  } satisfies typeof state))
}

export function toggleTableSelection(id: string, schema: string, table: string) {
  const store = databaseStore(id)
  store.setState((state) => {
    const key = `${schema}:${table}`
    const isSelected = state.selectedTables.some(t => `${t.schema}:${t.table}` === key)

    return {
      ...state,
      selectedTables: isSelected
        ? state.selectedTables.filter(t => `${t.schema}:${t.table}` !== key)
        : [...state.selectedTables, { schema, table }],
    } satisfies typeof state
  })
}

export function clearTableSelection(id: string) {
  const store = databaseStore(id)
  store.setState(state => ({
    ...state,
    selectedTables: [],
  } satisfies typeof state))
}

export function selectMultipleTables(id: string, tables: { schema: string, table: string }[]) {
  const store = databaseStore(id)
  store.setState(state => ({
    ...state,
    selectedTables: tables,
  } satisfies typeof state))
}

export function addMultipleTablesToFolder(id: string, schema: string, folder: string, tables: string[]) {
  const store = databaseStore(id)
  store.setState((state) => {
    // First, remove all these tables from any other folder in the same schema
    const updatedFolders = state.tableFolders
      .map(g =>
        g.schema === schema
          ? { ...g, tables: g.tables.filter(t => !tables.includes(t)) }
          : g,
      )
      .filter(g => g.tables.length > 0)

    const existingFolder = updatedFolders.find(g => g.schema === schema && g.folder === folder)

    if (existingFolder) {
      const newTables = tables.filter(t => !existingFolder.tables.includes(t))
      if (newTables.length === 0) {
        return {
          ...state,
          tableFolders: updatedFolders,
        } satisfies typeof state
      }

      return {
        ...state,
        tableFolders: updatedFolders.map(g =>
          g.schema === schema && g.folder === folder
            ? { ...g, tables: [...g.tables, ...newTables] }
            : g,
        ),
      } satisfies typeof state
    }

    return {
      ...state,
      tableFolders: [...updatedFolders, { schema, folder, tables }],
    } satisfies typeof state
  })
}
