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
import { cardClass } from '@tamery/ui/components/card.utils'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { createRef, useImperativeHandle, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'

import { getCapabilities } from '~/core/catalog/capabilities'
import { ShortcutKbd } from '~/core/keyboard/shortcut-kbd'
import { useShortcut } from '~/core/keyboard/use-shortcuts'
import { deleteRowsQuery } from '~/core/queries/rows/delete'
import { resourceRowsQueryInfiniteOptions } from '~/core/queries/rows/list'
import {
  keyedRowsCountQuery,
  resourceTableTotalQueryKey,
} from '~/core/queries/rows/total'
import { connectionResourceToQueryParams } from '~/core/runtime/query'
import type { PrimaryKeys } from '~/core/table/session'
import { primaryKeysKey, useTableSessionStore } from '~/core/table/session'
import { getDisplayValue } from '~/core/transformers/value-transformer'
import { queryClient } from '~/lib/query-client'
import { plural } from '~/utils/plural'

import { useTableColumnsContext } from '../../lib/columns'
import { useTablePageStore } from '../../lib/store'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const display = (value: unknown) =>
  getDisplayValue(value, Number.MAX_SAFE_INTEGER)

const rowLabel = (primaryKeys: PrimaryKeys) =>
  Object.entries(primaryKeys)
    .map(([column, value]) => `${column} ${display(value)}`)
    .join(' · ')

export const deleteRowsDialogRef = createRef<{
  open: (rows: PrimaryKeys[]) => void
}>()

export const DeleteRowsDialog = ({
  table,
  schema,
}: {
  table: string
  schema: string
}) => {
  const { connectionResource, dialect } = useRouteContext()
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<PrimaryKeys[]>([])
  const store = useTablePageStore()
  const sessionStore = useTableSessionStore()
  const { columns } = useTableColumnsContext()

  useImperativeHandle(deleteRowsDialogRef, () => ({
    open: (next) => {
      setRows(next)
      setOpen(true)
    },
  }))

  const { uniqueKeys } = getCapabilities(dialect)
  const { data: matched, isPending: isCounting } = useQuery({
    enabled: open && !uniqueKeys,
    queryFn: async () =>
      keyedRowsCountQuery({ columns, primaryKeys: rows, schema, table }).run(
        await connectionResourceToQueryParams(connectionResource)
      ),
    queryKey: ['keyed-rows-count', connectionResource.id, schema, table, rows],
  })
  const counting = !uniqueKeys && isCounting
  const sharedKeyRows =
    matched !== undefined && matched > rows.length ? matched : undefined

  const only = rows.length === 1 && !sharedKeyRows ? rows[0] : undefined
  const noun = only ? 'row' : plural(sharedKeyRows ?? rows.length, 'row')

  const { mutate: deleteRows, isPending: isDeleting } = useMutation({
    meta: { event: 'rows_deleted' },
    mutationFn: async () => {
      await deleteRowsQuery({
        columns,
        primaryKeys: rows,
        schema,
        table,
      }).run(await connectionResourceToQueryParams(connectionResource))
    },
    onError: (error) => {
      toast.error('Failed to delete rows', { description: error.message })
    },
    onSuccess: () => {
      const { filters, orderBy } = store.get()
      toast.success(`${plural(rows.length, 'row')} successfully deleted`)
      queryClient.invalidateQueries(
        resourceRowsQueryInfiniteOptions({
          connectionResource,
          query: { filters: enabledFilters(filters), orderBy },
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
      const deleted = new Set(rows.map(primaryKeysKey))
      sessionStore.set((state) => ({
        ...state,
        selected: state.selected.filter(
          (row) => !deleted.has(primaryKeysKey(row))
        ),
      }))
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {noun}?</AlertDialogTitle>
          <AlertDialogDescription>
            {only ? (
              <>
                The row with{' '}
                <span data-mask className="text-foreground font-medium">
                  {rowLabel(only)}
                </span>
              </>
            ) : (
              'These rows'
            )}{' '}
            will be removed from{' '}
            <span data-mask className="text-foreground font-medium">
              {table}
            </span>
            . This cannot be undone.
            {sharedKeyRows !== undefined &&
              ` Keys are not unique here: the selected ${rows.length === 1 ? 'row shares its key' : 'rows share their keys'} with other rows, so all ${sharedKeyRows} are removed.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {!only && (
          <div className={cn(cardClass, 'overflow-hidden')}>
            <ScrollArea className="scroll-fade max-h-40">
              <ul>
                {rows.map((primaryKeys) => (
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
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogCancel
            variant="destructive"
            disabled={counting}
            onClick={() => deleteRows()}
          >
            <LoadingContent loading={isDeleting || counting}>
              Delete {noun}
            </LoadingContent>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const ActionsDelete = () => {
  const sessionStore = useTableSessionStore()
  const selected = useSubscription(sessionStore, {
    selector: (state) => state.selected,
  })
  const openDialog = () => deleteRowsDialogRef.current?.open(selected)

  useShortcut('deleteRows', openDialog, { ignoreInputs: true })

  return (
    <Tooltip shortcut={<ShortcutKbd shortcut="deleteRows" />}>
      <TooltipTrigger
        render={
          <Button
            variant="destructive"
            size="sm"
            aria-label={`Delete (${selected.length})`}
            onClick={openDialog}
          />
        }
      >
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
        <span>
          Delete (
          <NumberFlow spinTiming={{ duration: 200 }} value={selected.length} />)
        </span>
      </TooltipTrigger>
      <TooltipContent>Delete selected rows</TooltipContent>
    </Tooltip>
  )
}
