import { AlertDialog, AlertDialogClose, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@conar/ui/components/alert-dialog'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import NumberFlow from '@number-flow/react'
import { RiDeleteBin7Line } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { deleteRowsQuery, resourceRowsQuery, resourceTableTotalQuery } from '~/entities/connection/queries'
import { connectionResourceToQueryParams } from '~/entities/connection/query'
import { queryClient } from '~/main'
import { Route } from '../..'
import { usePageStoreContext } from '../../-store'

export function HeaderActionsDelete({ table, schema }: { table: string, schema: string }) {
  const { connectionResource } = Route.useRouteContext()
  const [isOpened, setIsOpened] = useState(false)
  const store = usePageStoreContext()
  const selected = useStore(store, state => state.selected)

  const { mutate: deleteRows, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      await deleteRowsQuery({ table, schema, primaryKeys: selected }).run(connectionResourceToQueryParams(connectionResource))
    },
    onSuccess: () => {
      toast.success(`${selected.length} row${selected.length === 1 ? '' : 's'} successfully deleted`)
      queryClient.invalidateQueries(resourceRowsQuery({ connectionResource, table, schema, query: { filters: store.state.filters, orderBy: store.state.orderBy } }))
      queryClient.invalidateQueries(resourceTableTotalQuery({ connectionResource, table, schema, query: { filters: store.state.filters, exact: store.state.exact } }))
      store.setState(state => ({
        ...state,
        selected: [],
      } satisfies typeof state))
    },
    onError: (error) => {
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
              {selected.length === 1 ? '' : 's'}
              {' '}
              deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected
              {' '}
              {selected.length}
              {' '}
              {selected.length === 1 ? 'row' : 'rows'}
              {' '}
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
            <AlertDialogClose render={<Button variant="destructive" />} onClick={() => deleteRows()}>
              <LoadingContent loading={isDeleting}>
                Delete
                {' '}
                {selected.length}
                {' '}
                selected row
                {selected.length === 1 ? '' : 's'}
              </LoadingContent>
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.1 }}
          >
            <Button variant="destructive" onClick={() => setIsOpened(true)}>
              <RiDeleteBin7Line />
              <span>
                Delete
                (
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
