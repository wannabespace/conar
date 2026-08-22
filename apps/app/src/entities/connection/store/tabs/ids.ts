import { nanoid } from 'nanoid'

import type { ConnectionTab, DefinitionsSection } from './types'
import { definitionsSectionType } from './types'

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
