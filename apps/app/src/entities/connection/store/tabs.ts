import { type } from 'arktype'
import { nanoid } from 'nanoid'

export const DEFINITIONS_SECTIONS = [
  'enums',
  'constraints',
  'indexes',
  'policies',
  'triggers',
  'functions',
] as const

export type DefinitionsSection = (typeof DEFINITIONS_SECTIONS)[number]

export const definitionsSectionType = type.enumerated(...DEFINITIONS_SECTIONS)

const tableTabType = type({
  id: 'string',
  preview: 'boolean',
  schema: 'string',
  table: 'string',
  'title?': 'string',
  type: '"table"',
})

const runnerTabType = type({
  id: 'string',
  'title?': 'string',
  type: '"runner"',
})

const definitionsTabType = type({
  id: 'string',
  preview: 'boolean',
  section: definitionsSectionType,
  'title?': 'string',
  type: '"definitions"',
})

const visualizerTabType = type({
  id: 'string',
  'title?': 'string',
  type: '"visualizer"',
})

export const connectionTabType = tableTabType
  .or(runnerTabType)
  .or(definitionsTabType)
  .or(visualizerTabType)

export type ConnectionTab = typeof connectionTabType.infer
export type ConnectionTabType = ConnectionTab['type']

export type PreviewableTab = Extract<ConnectionTab, { preview: boolean }>

export const isPreviewTab = (tab: ConnectionTab): tab is PreviewableTab =>
  'preview' in tab && tab.preview

export const tableTabId = (schema: string, table: string) =>
  `table:${encodeURIComponent(schema)}:${encodeURIComponent(table)}`

export const definitionsTabId = (section: DefinitionsSection) =>
  `definitions:${section}`

export const runnerTabId = () => `runner:${nanoid(10)}`

export const VISUALIZER_TAB_ID = 'visualizer'

const isDefinitionsSection = (value: string): value is DefinitionsSection =>
  // SAFETY: widening the literal tuple to `readonly string[]` only relaxes the
  // argument type of `includes`; the predicate itself is what narrows.
  (DEFINITIONS_SECTIONS as readonly string[]).includes(value)

export const parseTabId = (id: string): ConnectionTab | null => {
  const [kind, ...rest] = id.split(':')

  if (kind === 'table') {
    const [schema, table] = rest
    return rest.length === 2 && schema && table
      ? {
          id,
          preview: false,
          schema: decodeURIComponent(schema),
          table: decodeURIComponent(table),
          type: 'table',
        }
      : null
  }

  if (kind === 'definitions') {
    const [section] = rest
    return rest.length === 1 && section && isDefinitionsSection(section)
      ? { id, preview: false, section, type: 'definitions' }
      : null
  }

  if (kind === 'runner') {
    return rest.length === 1 && rest[0] ? { id, type: 'runner' } : null
  }

  if (kind === 'visualizer') {
    return rest.length === 0 ? { id, type: 'visualizer' } : null
  }

  return null
}

export const DEFINITIONS_TITLES = {
  constraints: 'Constraints',
  enums: 'Enums',
  functions: 'Functions',
  indexes: 'Indexes',
  policies: 'Policies',
  triggers: 'Triggers',
} satisfies Record<DefinitionsSection, string>

export const tabTitle = (tab: ConnectionTab) => {
  if (tab.type === 'table') {
    return tab.table
  }
  if (tab.type === 'definitions') {
    return DEFINITIONS_TITLES[tab.section]
  }
  return tab.type === 'runner' ? 'SQL Runner' : 'Visualizer'
}
