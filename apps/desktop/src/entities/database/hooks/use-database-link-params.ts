import type { LinkProps } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useMemo } from 'react'
import { databaseStore } from '~/routes/(protected)/_protected/database/-store'

export function useDatabaseLinkParams(id: string) {
  const store = databaseStore(id)
  const [lastOpenedTable, lastOpenedPage, lastChatId] = useStore(store, state => [state.lastOpenedTable, state.lastOpenedPage, state.lastOpenedChatId])

  return useMemo((): LinkProps => {
    if (lastOpenedPage) {
      if (lastOpenedPage === '/(protected)/_protected/database/$id/enums/') {
        return {
          to: '/database/$id/enums',
          params: { id },
        }
      }
      else if (lastOpenedPage === '/(protected)/_protected/database/$id/sql/') {
        return {
          to: '/database/$id/sql',
          params: { id },
          search: lastChatId ? { chatId: lastChatId } : undefined,
        }
      }
      else if (lastOpenedPage === '/(protected)/_protected/database/$id/visualizer/') {
        return {
          to: '/database/$id/visualizer',
          params: { id },
        }
      }
    }

    return {
      to: '/database/$id/table',
      params: { id },
      search: lastOpenedTable ? { schema: lastOpenedTable.schema, table: lastOpenedTable.table } : undefined,
    }
  }, [id, lastOpenedPage, lastOpenedTable, lastChatId])
}
