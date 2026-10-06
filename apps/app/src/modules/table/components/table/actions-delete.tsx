import { Delete02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { enabledFilters } from '@tamery/shared/filters'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@tamery/ui/components/alert-dialog'
import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { cn } from '@tamery/ui/lib/utils'
import { useMutation } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'

import { cardClass } from '~/components/card'
import { deleteRowsQuery } from '~/core/queries/rows/delete'
import { resourceRowsQueryInfiniteOptions } from '~/core/queries/rows/list'
import { resourceTableTotalQueryKey } from '~/core/queries/rows/total'
import { connectionResourceToQueryParams } from '~/core/runtime/query'
import type { PrimaryKeys } from '~/core/table/session'
import { primaryKeysKey, useTableSessionStore } from '~/core/table/session'
import { getDisplayValue } from '~/core/transformers/value-transformer'
import { queryClient } from '~/lib/query-client'

import { useTableColumnsContext } from '../../lib/columns'
import { useTablePageStore } from '../../lib/store'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const display = (value: unknown) =>
  getDisplayValue(value, Number.MAX_SAFE_INTEGER)

const rowLabel = (primaryKeys: PrimaryKeys) => {
  const entries = Object.entries(primaryKeys)
  return entries.length === 1
    ? display(entries[0]?.[1])
    : entries
        .map(([column, value]) => `${column} ${display(value)}`)
        .join(' · ')
}

export const ActionsDelete = ({
  table,
  schema,
}: {
  table: string
  schema: string
}) => {
  const { connectionResource } = useRouteContext()
  const [isOpened, setIsOpened] = useState(false)
  const store = useTablePageStore()
  const sessionStore = useTableSessionStore()
  const { columns } = useTableColumnsContext()
  const selected = useSubscription(sessionStore, {
    selector: (state) => state.selected,
  })

  const [only] = selected.length === 1 ? selected : []
  const noun = only ? 'row' : `${selected.length} rows`

  const { mutate: deleteRows, isPending: isDeleting } = useMutation({
    meta: { event: 'rows_deleted' },
    mutationFn: async () => {
      await deleteRowsQuery({
        columns,
        primaryKeys: selected,
        schema,
        table,
      }).run(await connectionResourceToQueryParams(connectionResource))
    },
    onError: (error) => {
      toast.error('Failed to delete rows', {
        description: error.message,
      })
    },
    onSuccess: () => {
      toast.success(
        `${selected.length} row${selected.length === 1 ? '' : 's'} successfully deleted`
      )
      queryClient.invalidateQueries(
        resourceRowsQueryInfiniteOptions({
          connectionResource,
          query: {
            filters: enabledFilters(store.get().filters),
            orderBy: store.get().orderBy,
          },
          schema,
          table,
        })
      )
      queryClient.invalidateQueries({
        queryKey: resourceTableTotalQueryKey({
          connectionResource,
          schema,
          table,
        }),
      })
      sessionStore.set((state) => ({ ...state, selected: [] }))
    },
  })

  return (
    <>
      <AlertDialog open={isOpened} onOpenChange={setIsOpened}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {noun}?</AlertDialogTitle>
            <AlertDialogDescription>
              {only ? (
                <span data-mask className="text-foreground font-medium">
                  {rowLabel(only)}
                </span>
              ) : (
                'These rows'
              )}{' '}
              will be removed from{' '}
              <span data-mask className="text-foreground font-medium">
                {table}
              </span>
              . This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!only && (
            <div className={cn(cardClass, 'overflow-hidden')}>
              <ScrollArea className="scroll-fade max-h-40">
                <ul>
                  {selected.map((primaryKeys) => (
                    <li
                      key={primaryKeysKey(primaryKeys)}
                      data-mask
                      className="border-foreground/6 truncate border-b px-3 py-1.5 text-xs tabular-nums last:border-0"
                    >
                      {rowLabel(primaryKeys)}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
            <AlertDialogCancel
              variant="destructive"
              onClick={() => deleteRows()}
            >
              <LoadingContent loading={isDeleting}>
                Delete {noun}
              </LoadingContent>
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button variant="destructive" size="sm" onClick={() => setIsOpened(true)}>
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
        <span>
          Delete (
          <NumberFlow spinTiming={{ duration: 200 }} value={selected.length} />)
        </span>
      </Button>
    </>
  )
}
