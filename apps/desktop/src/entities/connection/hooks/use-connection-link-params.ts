import type { LinkProps } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useMemo } from 'react'
import { connectionResourceStore } from '~/entities/connection/store'

export function useConnectionResourceLinkParams(resourceId: string) {
  const store = connectionResourceStore(resourceId)
  const [lastOpenedTable, lastOpenedPage, lastChatId] = useStore(store, state => [state.lastOpenedTable, state.lastOpenedPage, state.lastOpenedChatId])

  return useMemo((): LinkProps => {
    if (lastOpenedPage) {
      if (lastOpenedPage === '/_protected/connection/$resourceId/definitions/enums/') {
        return {
          to: '/connection/$resourceId/definitions/enums',
          params: { resourceId },
        }
      }
      else if (lastOpenedPage === '/_protected/connection/$resourceId/query/') {
        return {
          to: '/connection/$resourceId/query',
          params: { resourceId },
          search: lastChatId ? { chatId: lastChatId } : undefined,
        }
      }
      else if (lastOpenedPage === '/_protected/connection/$resourceId/visualizer/') {
        return {
          to: '/connection/$resourceId/visualizer',
          params: { resourceId },
        }
      }
    }

    return {
      to: '/connection/$resourceId/table',
      params: { resourceId },
      search: lastOpenedTable ? { schema: lastOpenedTable.schema, table: lastOpenedTable.table } : undefined,
    }
  }, [resourceId, lastOpenedPage, lastOpenedTable, lastChatId])
}
