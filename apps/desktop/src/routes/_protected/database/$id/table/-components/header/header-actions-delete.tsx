import type { connections } from '~/drizzle'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@conar/ui/components/alert-dialog'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import NumberFlow from '@number-flow/react'
import { RiDeleteBin7Line } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { connectionRowsQuery, connectionTableTotalQuery } from '~/entities/connection/queries'
import { deleteRowsQuery } from '~/entities/connection/sql/delete-rows'
import { queryClient } from '~/main'
import { usePageStoreContext } from '../../-store'

export function HeaderActionsDelete({ table, schema, connection }: { table: string, schema: string, connection: typeof connections.$inferSelect }) {
  const [isOpened, setIsOpened] = useState(false)
  const store = usePageStoreContext()
  const selected = useStore(store, state => state.selected)

  const { mutate: deleteRows, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      await deleteRowsQuery(connection, { table, schema, primaryKeys: selected })
    },
    onSuccess: () => {
      toast.success(`${selected.length} row${selected.length === 1 ? '' : 's'} successfully deleted`)
      queryClient.invalidateQueries(connectionRowsQuery({ connection, table, schema, query: { filters: store.state.filters, orderBy: store.state.orderBy } }))
      queryClient.invalidateQueries(connectionTableTotalQuery({ connection, table, schema, query: { filters: store.state.filters, exact: store.state.exact } }))
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => deleteRows()}>
              <LoadingContent loading={isDeleting}>
                Delete
                {' '}
                {selected.length}
                {' '}
                selected row
                {selected.length === 1 ? '' : 's'}
              </LoadingContent>
            </AlertDialogAction>
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
