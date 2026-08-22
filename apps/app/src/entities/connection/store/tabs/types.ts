import { type } from 'arktype'

export const definitionsSectionType = type(
  "'enums' | 'constraints' | 'indexes' | 'policies' | 'triggers' | 'functions'"
)

export type DefinitionsSection = typeof definitionsSectionType.infer

export const connectionTabType = type({
  id: 'string',
  'title?': 'string',
}).and(
  type.or(
    type({
      preview: 'boolean',
      schema: 'string',
      table: 'string',
      type: '"table"',
    }),
    type({
      preview: 'boolean',
      section: definitionsSectionType,
      type: '"definitions"',
    }),
    type({ type: '"runner" | "visualizer"' })
  )
)

export type ConnectionTab = typeof connectionTabType.infer

export const isPreviewTab = (
  tab: ConnectionTab
): tab is Extract<ConnectionTab, { preview: boolean }> =>
  'preview' in tab && tab.preview
