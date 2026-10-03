import { PlusSignIcon } from '@hugeicons/core-free-icons'

import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import { parseTableTabId } from '~/core/tabs/ids'
import type { ProtectedModule } from '~/lib/module'
import { queryClient } from '~/lib/query-client'

import { addColumnDialogRef } from './components/table/add-column-dialog'

export default {
  commands: ({ current, tabId }) => {
    const active = tabId ? parseTableTabId(tabId) : null

    if (!(current && active)) {
      return []
    }

    const isBaseTable =
      queryClient
        .getQueryData(
          resourceTablesAndSchemasQueryOptions({
            connectionResource: current.connectionResource,
          }).queryKey
        )
        ?.schemas.find((schema) => schema.name === active.schema)
        ?.tables.find((table) => table.name === active.table)?.type === 'table'

    return isBaseTable
      ? [
          {
            action: () => addColumnDialogRef.current?.add(),
            group: 'Database',
            icon: PlusSignIcon,
            keywords: ['create', 'new', 'column', active.table],
            order: 40,
            value: 'Add column…',
          },
        ]
      : []
  },
} satisfies ProtectedModule
