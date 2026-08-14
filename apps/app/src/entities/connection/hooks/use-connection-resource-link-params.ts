import type { LinkProps } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useSubscription } from 'seitu/react'

import { getConnectionResourceStore } from '~/entities/connection/store'

export const useConnectionResourceLinkParams = (resourceId: string) => {
  const store = getConnectionResourceStore(resourceId)
  const [lastOpenedTable, lastOpenedPage, lastChatId] = useSubscription(store, {
    selector: (state) => [
      state.lastOpenedTable,
      state.lastOpenedPage,
      state.lastOpenedChatId,
    ],
  })

  return useMemo((): LinkProps => {
    if (lastOpenedPage) {
      if (
        lastOpenedPage ===
        '/_protected/connection/$resourceId/definitions/enums/'
      ) {
        return {
          params: { resourceId },
          to: '/connection/$resourceId/definitions/enums',
        }
      } else if (
        lastOpenedPage === '/_protected/connection/$resourceId/query/'
      ) {
        return {
          params: { resourceId },
          search: lastChatId ? { chatId: lastChatId } : undefined,
          to: '/connection/$resourceId/query',
        }
      } else if (
        lastOpenedPage === '/_protected/connection/$resourceId/visualizer/'
      ) {
        return {
          params: { resourceId },
          to: '/connection/$resourceId/visualizer',
        }
      }
    }

    return {
      params: { resourceId },
      search: lastOpenedTable
        ? { schema: lastOpenedTable.schema, table: lastOpenedTable.table }
        : undefined,
      to: '/connection/$resourceId/table',
    }
  }, [resourceId, lastOpenedPage, lastOpenedTable, lastChatId])
}
