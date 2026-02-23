import { ConnectionType } from '@conar/shared/enums/connection-type'
import { Alert, AlertDescription, AlertTitle } from '@conar/ui/components/alert'
import { Button } from '@conar/ui/components/button'
import { Checkbox } from '@conar/ui/components/checkbox'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from '@conar/ui/components/dialog'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { RiAlertLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { dropTableQuery, resourceTablesAndSchemasQuery } from '~/entities/connection/queries'
import { connectionResourceToQueryParams } from '~/entities/connection/query'
import { connectionResourceStore, removeTab } from '~/entities/connection/store'
import { queryClient } from '~/main'
import { Route } from '..'

interface DropTableDialogProps {
  ref: React.RefObject<{
    drop: (schema: string, table: string) => void
  } | null>
}

export function DropTableDialog({ ref }: DropTableDialogProps) {
  const { connection, connectionResource } = Route.useRouteContext()
  const { schema: schemaFromSearch, table: tableFromSearch } = Route.useSearch()
  const store = connectionResourceStore(connectionResource.id)
  const router = useRouter()
  const [confirmationText, setConfirmationText] = useState('')
  const [schema, setSchema] = useState('')
  const [table, setTable] = useState('')
  const [open, setOpen] = useState(false)
  const [cascade, setCascade] = useState(false)
  const isCurrentTable = schema === schemaFromSearch && table === tableFromSearch

  useImperativeHandle(ref, () => ({
    drop: (schema, table) => {
      setSchema(schema)
      setTable(table)
      setConfirmationText('')
      setCascade(false)
      setOpen(true)
      const lastOpenedTable = store.state.lastOpenedTable

      if (lastOpenedTable?.schema === schema && lastOpenedTable?.table === table) {
        store.setState(state => ({
          ...state,
          lastOpenedTable: null,
        } satisfies typeof state))
      }
    },
  }))

  const { mutate: dropTable, isPending } = useMutation({
    mutationFn: async () => {
      await dropTableQuery({ table, schema, cascade }).run(connectionResourceToQueryParams(connectionResource))
    },
    onSuccess: async () => {
      toast.success(`Table "${table}" successfully dropped`)
      setOpen(false)
      setConfirmationText('')
      setCascade(false)

      queryClient.invalidateQueries(resourceTablesAndSchemasQuery({ connectionResource, showSystem: store.state.showSystem }))

      if (isCurrentTable) {
        await router.navigate({
          to: '/connection/$resourceId/table',
          params: { resourceId: connectionResource.id },
        })
      }
      removeTab(connectionResource.id, schema, table)
    },
    onError: (error) => {
      toast.error(`Failed to drop table "${error.message}".`)
    },
  })

  const canConfirm = confirmationText === table

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Drop Table
          </DialogTitle>
        </DialogHeader>
        <DialogPanel className="space-y-4">
          <Alert variant="destructive">
            <RiAlertLine className="size-5 text-destructive" />
            <AlertTitle>This action cannot be undone.</AlertTitle>
            <AlertDescription>
              This will permanently delete the table and all its data from the database.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              <span>
                Type
                {' '}
                <span className="font-semibold">
                  {table}
                </span>
                {' '}
                to confirm
              </span>
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={e => setConfirmationText(e.target.value)}
              placeholder={table}
              spellCheck={false}
              autoComplete="off"
              autoFocus
            />
          </div>
          {connection.type !== ConnectionType.ClickHouse && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cascade"
                checked={cascade}
                onCheckedChange={() => setCascade(!cascade)}
              />
              <Label htmlFor="cascade" className="font-normal">
                Drop tables that depend on this table (CASCADE)
              </Label>
            </div>
          )}
        </DialogPanel>
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" />}
            onClick={() => {
              setConfirmationText('')
              setCascade(false)
            }}
          >
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => dropTable()}
            disabled={!canConfirm || isPending}
          >
            <LoadingContent loading={isPending}>
              Drop Table
            </LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
