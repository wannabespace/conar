import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@connnect/ui/components/alert-dialog'
import { Button } from '@connnect/ui/components/button'
import { LoadingContent } from '@connnect/ui/components/custom/loading-content'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import NumberFlow from '@number-flow/react'
import { RiDeleteBin7Line, RiLoopLeftLine } from '@remixicon/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { databaseColumnsQuery, databaseRowsQuery, useDatabase } from '~/entities/database'
import { deleteRowsSql } from '~/entities/database/sql/delete'
import { queryClient } from '~/main'
import { usePrimaryKeysQuery } from '../-queries/use-primary-keys-query'
import { tableStore } from './table'

export function HeaderActions() {
  const { id, table, schema } = useParams({ from: '/(protected)/_protected/database/$id/tables/$schema/$table/' })
  const { data: database } = useDatabase(id)
  const { data: primaryKeys } = usePrimaryKeysQuery(database, table, schema)
  const [page, pageSize, selectedRows] = useStore(tableStore, state => [state.page, state.pageSize, state.selectedRows])
  const queryOpts = databaseRowsQuery(database, table, schema, { page, limit: pageSize })
  const { isFetching, dataUpdatedAt, data } = useQuery(queryOpts)

  const selected = useMemo(() => {
    if (!primaryKeys?.length || !data?.rows)
      return []

    return Object.keys(selectedRows)
      .filter(index => data.rows[Number(index)])
      .map((index) => {
        const row = data.rows[Number(index)]

        return primaryKeys.reduce((acc, key) => {
          acc[key] = row[key]
          return acc
        }, {} as Record<string, unknown>)
      })
  }, [selectedRows, primaryKeys, data?.rows])

  const { mutate: deleteRows, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: deleteRowsSql(table, schema, selected)[database.type],
      })
    },
    onSuccess: () => {
      toast.success(`${selected.length} row${selected.length === 1 ? '' : 's'} successfully deleted`)
      queryClient.invalidateQueries({ queryKey: queryOpts.queryKey.slice(0, -1) })
      queryClient.invalidateQueries({ queryKey: databaseColumnsQuery(database, table, schema).queryKey })
      tableStore.setState(state => ({ ...state, selectedRows: {} }))
    },
    onError: (error) => {
      toast.error('Failed to delete rows', {
        description: error.message,
      })
    },
  })

  async function handleRefresh() {
    tableStore.setState(state => ({ ...state, page: 1 }))
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryOpts.queryKey.slice(0, -1) }),
      queryClient.invalidateQueries({ queryKey: databaseColumnsQuery(database, table, schema).queryKey }),
    ])
    toast.success('Data refreshed')
  }

  return (
    <div className="flex gap-2">
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, type: 'spring' }}
          >
            <AlertDialog>
              <TooltipProvider>
                <Tooltip>
                  <AlertDialogTrigger asChild>
                    <TooltipTrigger asChild>
                      <Button variant="outline">
                        <RiDeleteBin7Line />
                        <span>
                          Remove
                          (
                          <NumberFlow spinTiming={{ duration: 200 }} value={selected.length} />
                          )
                        </span>
                      </Button>
                    </TooltipTrigger>
                  </AlertDialogTrigger>
                  <TooltipContent side="left">
                    Remove
                    {' '}
                    {selected.length}
                    {' '}
                    selected row
                    {selected.length === 1 ? '' : 's'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                      Remove
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
          </motion.div>
        )}
      </AnimatePresence>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isFetching}
            >
              <LoadingContent loading={isFetching}>
                <RiLoopLeftLine />
              </LoadingContent>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            Refresh data
            <p className="text-xs text-muted-foreground">
              Table data is cached. Click to fetch the latest data.
            </p>
            <p className="text-xs text-muted-foreground">
              Last updated:
              {' '}
              {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'never'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
