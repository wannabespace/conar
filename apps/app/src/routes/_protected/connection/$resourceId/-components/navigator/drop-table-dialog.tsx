import { Alert02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@tamery/ui/components/alert'
import { Button } from '@tamery/ui/components/button'
import { Checkbox } from '@tamery/ui/components/checkbox'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@tamery/ui/components/dialog'
import { Input } from '@tamery/ui/components/input'
import { Label } from '@tamery/ui/components/label'
import { useMutation } from '@tanstack/react-query'
import { getRouteApi, useParams, useRouter } from '@tanstack/react-router'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'

import {
  dropTableQuery,
  resourceTablesAndSchemasQueryOptions,
} from '~/entities/connection/queries'
import { connectionResourceToQueryParams } from '~/entities/connection/runtime'
import {
  getConnectionResourceStore,
  removeTableTab,
  tableTabId,
} from '~/entities/connection/store'
import { queryClient } from '~/main'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

interface DropTableDialogProps {
  ref: React.RefObject<{
    drop: (schema: string, table: string) => void
  } | null>
}

export const DropTableDialog = ({ ref }: DropTableDialogProps) => {
  const { connection, connectionResource } = useRouteContext()
  const { tabId: activeTabId } = useParams({ strict: false })
  const store = getConnectionResourceStore(connectionResource.id)
  const router = useRouter()
  const [confirmationText, setConfirmationText] = useState('')
  const [schema, setSchema] = useState('')
  const [table, setTable] = useState('')
  const [open, setOpen] = useState(false)
  const [cascade, setCascade] = useState(false)
  const isCurrentTable = activeTabId === tableTabId(schema, table)

  useImperativeHandle(ref, () => ({
    drop: (nextSchema, nextTable) => {
      setSchema(nextSchema)
      setTable(nextTable)
      setConfirmationText('')
      setCascade(false)
      setOpen(true)
    },
  }))

  const { mutate: dropTable, isPending } = useMutation({
    mutationFn: async () => {
      await dropTableQuery({ table, schema, cascade }).run(
        await connectionResourceToQueryParams(connectionResource)
      )
    },
    onSuccess: async () => {
      toast.success(`Table "${table}" successfully dropped`)
      setOpen(false)
      setConfirmationText('')
      setCascade(false)

      queryClient.invalidateQueries(
        resourceTablesAndSchemasQueryOptions({
          connectionResource,
          showSystem: store.get().showSystem,
        })
      )

      if (isCurrentTable) {
        await router.navigate({
          to: '/connection/$resourceId',
          params: { resourceId: connectionResource.id },
        })
      }
      removeTableTab(connectionResource.id, schema, table)
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
          <DialogTitle>Drop Table</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert variant="destructive">
            <HugeiconsIcon
              icon={Alert02Icon}
              strokeWidth={2}
              className="text-destructive size-5"
            />
            <AlertTitle>This action cannot be undone.</AlertTitle>
            <AlertDescription>
              This will permanently delete the table and all its data from the
              database.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              <span>
                Type{' '}
                <span data-mask className="font-semibold">
                  {table}
                </span>{' '}
                to confirm
              </span>
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={table}
              spellCheck={false}
              autoComplete="off"
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
        </div>
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
            <LoadingContent loading={isPending}>Drop Table</LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
