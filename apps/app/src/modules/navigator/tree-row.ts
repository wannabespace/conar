import type { tablesAndSchemasType } from '~/core/queries/tables/list'

interface TableInfo {
  name: string
  rowLevelSecurity?: boolean
  type: (typeof tablesAndSchemasType.infer)['type']
}

export type TreeRow =
  | {
      kind: 'schema'
      id: string
      name: string
      open: boolean
    }
  | {
      kind: 'table'
      id: string
      schema: string
      table: TableInfo
      pinned: boolean
    }
  | { kind: 'separator'; id: string }
