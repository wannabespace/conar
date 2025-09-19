import type { LinkProps } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useLastOpenedChatId, useLastOpenedPage, useLastOpenedTable } from '~/entities/database'

export function useDatabaseLinkParams(id: string) {
  const [lastOpenedTable] = useLastOpenedTable(id)
  const [lastOpenedPage] = useLastOpenedPage(id)
  const [lastChatId] = useLastOpenedChatId(id)

  const params = useMemo((): LinkProps => {
    if (lastOpenedPage) {
      if (lastOpenedPage === '/(protected)/_protected/database/$id/enums/') {
        return { to: '/database/$id/enums', params: { id } }
      }
      else if (lastOpenedPage === '/(protected)/_protected/database/$id/sql/') {
        return {
          to: '/database/$id/sql',
          params: { id },
          search: lastChatId ? { chatId: lastChatId } : undefined,
        }
      }
      else if (lastOpenedPage === '/(protected)/_protected/database/$id/table/') {
        return {
          to: '/database/$id/table',
          params: { id },
          search: lastOpenedTable ? { schema: lastOpenedTable.schema, table: lastOpenedTable.table } : undefined,
        }
      }
    }

    return {
      to: '/database/$id/table',
      params: { id },
      search: lastOpenedTable ? { schema: lastOpenedTable.schema, table: lastOpenedTable.table } : undefined,
    }
  }, [id, lastOpenedPage, lastOpenedTable, lastChatId])

  return params
}
