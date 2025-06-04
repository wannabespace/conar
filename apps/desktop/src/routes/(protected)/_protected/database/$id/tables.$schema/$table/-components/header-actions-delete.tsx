import type { Database } from '~/lib/indexeddb'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@connnect/ui/components/alert-dialog'
import { Button } from '@connnect/ui/components/button'
import { LoadingContent } from '@connnect/ui/components/custom/loading-content'
import NumberFlow from '@number-flow/react'
import { RiDeleteBin7Line } from '@remixicon/react'
import { useInfiniteQuery, useMutation } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { databaseColumnsQuery, databaseTableTotalQuery, deleteRowsSql } from '~/entities/database'
import { queryClient } from '~/main'
import { usePageContext } from '..'
import { usePrimaryKeysQuery } from '../-queries/use-primary-keys-query'
import { useRowsQueryOpts } from '../-queries/use-rows-query-opts'

export function HeaderActionsDelete({ table, schema, database }: { table: string, schema: string, database: Database }) {
  const rowsQueryOpts = useRowsQueryOpts()
  const { data: rows, refetch } = useInfiniteQuery(rowsQueryOpts)
  const [isOpened, setIsOpened] = useState(false)
  const { store } = usePageContext()
  const selected = useStore(store, state => state.selected)
  const { data: primaryKeys } = usePrimaryKeysQuery(database, table, schema)

  const selectedRows = useMemo(() => {
    if (!primaryKeys?.length || !rows)
      return []

    return selected.map((index) => {
      const row = rows[index]

      return primaryKeys.reduce((acc, key) => {
        acc[key] = row[key]
        return acc
      }, {} as Record<string, unknown>)
    })
  }, [selected, primaryKeys, rows])

  const { mutate: deleteRows, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: deleteRowsSql(table, schema, selectedRows)[database.type],
      })
    },
    onSuccess: () => {
      toast.success(`${selectedRows.length} row${selectedRows.length === 1 ? '' : 's'} successfully deleted`)
      refetch()
      queryClient.invalidateQueries({ queryKey: databaseColumnsQuery(database, table, schema).queryKey })
      queryClient.invalidateQueries({
        queryKey: databaseTableTotalQuery(database, table, schema, {
          filters: store.state.filters,
        }).queryKey,
      })
      store.setState(state => ({
        ...state,
        selected: [],
      }))
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
              {selectedRows.length === 1 ? '' : 's'}
              {' '}
              deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected
              {' '}
              {selectedRows.length}
              {' '}
              {selectedRows.length === 1 ? 'row' : 'rows'}
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
                {selectedRows.length}
                {' '}
                selected row
                {selectedRows.length === 1 ? '' : 's'}
              </LoadingContent>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AnimatePresence>
        {selectedRows.length > 0 && (
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
                  value={selectedRows.length}
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
