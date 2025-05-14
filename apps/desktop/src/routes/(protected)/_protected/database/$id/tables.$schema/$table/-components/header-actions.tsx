import type { WhereFilter } from '~/entities/database'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@connnect/ui/components/alert-dialog'
import { Button } from '@connnect/ui/components/button'
import { LoadingContent } from '@connnect/ui/components/custom/loading-content'
import { Popover, PopoverContent, PopoverTrigger } from '@connnect/ui/components/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import NumberFlow from '@number-flow/react'
import { RiDeleteBin7Line, RiFilterLine, RiLoopLeftLine } from '@remixicon/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { databaseColumnsQuery, DataFilterForm, deleteRowsSql, useDatabase } from '~/entities/database'
import { queryClient } from '~/main'
import { Route, useTableStoreContext } from '..'
import { usePrimaryKeysQuery } from '../-queries/use-primary-keys-query'
import { useRowsQueryOpts } from '../-queries/use-rows-query-opts'

export function HeaderActions() {
  const { id, table, schema } = Route.useParams()
  const { data: database } = useDatabase(id)
  const store = useTableStoreContext()
  const selected = useStore(store, state => state.selected)
  const [isOpened, setIsOpened] = useState(false)
  const [isFiltersOpened, setIsFiltersOpened] = useState(false)
  const rowsQueryOpts = useRowsQueryOpts()
  const { isFetching, dataUpdatedAt, data } = useQuery(rowsQueryOpts)
  const { data: primaryKeys } = usePrimaryKeysQuery(database, table, schema)

  const selectedRows = useMemo(() => {
    if (!primaryKeys?.length || !data?.rows)
      return []

    return selected.map((index) => {
      const row = data.rows[index]

      return primaryKeys.reduce((acc, key) => {
        acc[key] = row[key]
        return acc
      }, {} as Record<string, unknown>)
    })
  }, [selected, primaryKeys, data?.rows])

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
      queryClient.invalidateQueries({ queryKey: rowsQueryOpts.queryKey.slice(0, -1) })
      queryClient.invalidateQueries({ queryKey: databaseColumnsQuery(database, table, schema).queryKey })
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

  async function handleRefresh() {
    store.setState(state => ({
      ...state,
      page: 1,
    }))
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: rowsQueryOpts.queryKey.slice(0, -1) }),
      queryClient.invalidateQueries({ queryKey: databaseColumnsQuery(database, table, schema).queryKey }),
    ])
    toast.success('Data refreshed')
  }

  return (
    <div className="flex gap-2">
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
                <NumberFlow spinTiming={{ duration: 200 }} value={selectedRows.length} />
                )
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <Popover open={isFiltersOpened} onOpenChange={setIsFiltersOpened}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button size="icon" variant="outline">
                  <RiFilterLine />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="left">
              Add new filter
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <PopoverContent className="p-0 w-2xs" side="left" align="start">
          <DataFilterForm
            onAdd={(filter) => {
              setIsFiltersOpened(false)
              store.setState(state => ({
                ...state,
                filters: [...state.filters, filter as WhereFilter],
              }))
            }}
          />
        </PopoverContent>
      </Popover>
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
