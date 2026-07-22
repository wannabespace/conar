import NumberFlow from '@number-flow/react'
import { RiDeleteBin7Line } from '@remixicon/react'
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
import { useMutation } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'

import {
  deleteRowsQuery,
  resourceRowsQueryInfiniteOptions,
  resourceTableTotalQueryOptions,
} from '~/entities/connection/queries'
import { connectionResourceToQueryParams } from '~/entities/connection/runtime'
import { queryClient } from '~/main'

import { useTablePageStore } from '../../-lib/store'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export function ActionsDelete({ table, schema }: { table: string; schema: string }) {
  const { connectionResource } = useRouteContext()
  const [isOpened, setIsOpened] = useState(false)
  const store = useTablePageStore()
  const selected = useSubscription(store, { selector: state => state.selected })

  const { mutate: deleteRows, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      await deleteRowsQuery({ table, schema, primaryKeys: selected }).run(
        await connectionResourceToQueryParams(connectionResource),
      )
    },
    onSuccess: () => {
      toast.success(
        `${selected.length} row${selected.length === 1 ? '' : 's'} successfully deleted`,
      )
      queryClient.invalidateQueries(
        resourceRowsQueryInfiniteOptions({
          connectionResource,
          table,
          schema,
          query: { filters: enabledFilters(store.get().filters), orderBy: store.get().orderBy },
        }),
      )
      queryClient.invalidateQueries(
        resourceTableTotalQueryOptions({
          connectionResource,
          table,
          schema,
          query: { filters: enabledFilters(store.get().filters), exact: store.get().exact },
        }),
      )
      store.set(
        state =>
          ({
            ...state,
            selected: [],
          }) satisfies typeof state,
      )
    },
    onError: error => {
      toast.error('Failed to delete rows', {
        description: error.message,
      })
    },
  })

  return (
    <>
      <AlertDialog open={isOpened} onOpenChange={setIsOpened}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm row
              {selected.length === 1 ? '' : 's'} deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected{' '}
              {selected.length} {selected.length === 1 ? 'row' : 'rows'} from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
            <AlertDialogCancel variant="destructive" onClick={() => deleteRows()}>
              <LoadingContent loading={isDeleting}>
                Delete {selected.length} selected row
                {selected.length === 1 ? '' : 's'}
              </LoadingContent>
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.1 }}
          >
            <Button variant="destructive" onClick={() => setIsOpened(true)}>
              <RiDeleteBin7Line />
              <span>
                Delete (
                <NumberFlow
                  spinTiming={{ duration: 200 }}
                  value={selected.length}
                  className="tabular-nums"
                />
                )
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
