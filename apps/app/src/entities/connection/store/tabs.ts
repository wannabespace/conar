import { type } from 'arktype'
import { nanoid } from 'nanoid'

const definitionsSectionType = type(
  "'enums' | 'constraints' | 'indexes' | 'policies' | 'triggers' | 'functions'"
)

export type DefinitionsSection = typeof definitionsSectionType.infer

export const connectionTabType = type({
  id: 'string',
  'title?': 'string',
}).and(
  type({
    preview: 'boolean',
    schema: 'string',
    table: 'string',
    type: '"table"',
  })
    .or({
      preview: 'boolean',
      section: definitionsSectionType,
      type: '"definitions"',
    })
    .or({ type: '"runner" | "visualizer"' })
)

export type ConnectionTab = typeof connectionTabType.infer

export const isPreviewTab = (
  tab: ConnectionTab
): tab is Extract<ConnectionTab, { preview: boolean }> =>
  'preview' in tab && tab.preview

export const tableTabId = (schema: string, table: string) =>
  `table:${encodeURIComponent(schema)}:${encodeURIComponent(table)}`

export const definitionsTabId = (section: DefinitionsSection) =>
  `definitions:${section}`

export const runnerTabId = () => `runner:${nanoid(10)}`

export const VISUALIZER_TAB_ID = 'visualizer'

export const runnerStoreKey = (resourceId: string, tabId: string) =>
  `${resourceId}.${tabId}.store`

export const runnerLayoutKey = (resourceId: string, tabId: string) =>
  `sql-layout-${resourceId}-${tabId}`

export const parseTabId = (id: string): ConnectionTab | null => {
  const [kind, first, second, ...extra] = id.split(':')

  if (extra.length > 0) {
    return null
  }

  if (kind === 'table' && first && second) {
    return {
      id,
      preview: false,
      schema: decodeURIComponent(first),
      table: decodeURIComponent(second),
      type: 'table',
    }
  }

  if (second !== undefined) {
    return null
  }

  if (kind === 'definitions' && definitionsSectionType.allows(first)) {
    return { id, preview: false, section: first, type: 'definitions' }
  }

  if (kind === 'runner' && first) {
    return { id, type: 'runner' }
  }

  if (kind === 'visualizer' && first === undefined) {
    return { id, type: 'visualizer' }
  }

  return null
}

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)

export const tabTitle = (tab: ConnectionTab) => {
  switch (tab.type) {
    case 'table': {
      return tab.table
    }
    case 'definitions': {
      return capitalize(tab.section)
    }
    case 'runner': {
      return 'SQL Runner'
    }
    case 'visualizer': {
      return 'Visualizer'
    }
    default: {
      return ''
    }
  }
}
