import { LayoutTable02Icon, ViewIcon } from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'

import type { tablesAndSchemasType } from '~/core/queries/tables/list'

type TableType = (typeof tablesAndSchemasType.infer)['type']

export const tableTypeIcon = {
  'materialized view': ViewIcon,
  table: LayoutTable02Icon,
  view: ViewIcon,
} satisfies Record<TableType, IconSvgElement>

export const tableTypeLabel = {
  'materialized view': 'Materialized view',
  table: 'Table',
  view: 'View',
} satisfies Record<TableType, string>
