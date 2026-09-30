import { LayoutTable02Icon, ViewIcon } from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'

import type { tablesAndSchemasType } from '~/entities/connection/queries/tables/list'

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

export const tableTypeIcon = {
  table: LayoutTable02Icon,
  view: ViewIcon,
  'materialized view': ViewIcon,
} satisfies Record<TableInfo['type'], IconSvgElement>

export const tableTypeLabel = {
  table: 'Table',
  view: 'View',
  'materialized view': 'Materialized view',
} satisfies Record<TableInfo['type'], string>
