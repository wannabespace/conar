import type { QueryKey } from '@tanstack/react-query'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@connnect/ui/components/alert-dialog'
import { Button } from '@connnect/ui/components/button'
import { LoadingContent } from '@connnect/ui/components/custom/loading-content'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { RiDeleteBin7Line, RiLoopLeftLine } from '@remixicon/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { databaseColumnsQuery, databaseRowsQuery, useDatabase } from '~/entities/database'
import { deleteRowsSql } from '~/entities/database/sql/delete'
import { queryClient } from '~/main'
import { tableStore } from '..'

export function TableHeader({ queryKey, columnsCount, selected, clearSelected }: { queryKey: QueryKey, columnsCount: number, selected: Record<string, unknown>[], clearSelected: () => void }) {
  const { id, table, schema } = useParams({ from: '/(protected)/_protected/database/$id/tables/$schema/$table/' })
  const { data: database } = useDatabase(id)
  const [page, pageSize] = useStore(tableStore, state => [state.page, state.pageSize])
  const { isFetching, dataUpdatedAt, data } = useQuery(databaseRowsQuery(database, table, schema, { page, limit: pageSize }))

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
      queryClient.invalidateQueries({ queryKey: queryKey.slice(0, -1) })
      queryClient.invalidateQueries({ queryKey: databaseColumnsQuery(database, table, schema).queryKey })
      clearSelected()
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
      queryClient.invalidateQueries({ queryKey: queryKey.slice(0, -1) }),
      queryClient.invalidateQueries({ queryKey: databaseColumnsQuery(database, table, schema).queryKey }),
    ])
    toast.success('Data refreshed')
  }

  return (
    <div className="flex gap-6 flex-row items-center justify-between p-4">
      <div>
        <h2 className="font-medium text-sm mb-0.5 space-x-1">
          <span className="text-muted-foreground">
            {schema}
          </span>
          {' '}
          <span className="text-muted-foreground/20">/</span>
          {' '}
          <span>{table}</span>
        </h2>
        <p className="text-muted-foreground text-xs">
          {columnsCount}
          {' '}
          column
          {columnsCount === 1 ? '' : 's'}
          {' '}
          •
          {' '}
          {data?.total ?? '...'}
          {' '}
          row
          {!!data && data.total !== 1 && 's'}
        </p>
      </div>
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
                          Remove (
                          {selected.length}
                          )
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
    </div>
  )
}
