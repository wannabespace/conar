import { RiInformationLine } from '@remixicon/react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@tamery/ui/components/alert'
import { Button } from '@tamery/ui/components/button'
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
  renameTableQuery,
  resourceTablesAndSchemasQueryOptions,
} from '~/entities/connection/queries'
import { connectionResourceToQueryParams } from '~/entities/connection/runtime'
import {
  getConnectionResourceStore,
  renameTableTab,
  tableTabId,
} from '~/entities/connection/store'
import { queryClient } from '~/main'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

interface RenameTableDialogProps {
  ref: React.RefObject<{
    rename: (schema: string, table: string) => void
  } | null>
}

export const RenameTableDialog = ({ ref }: RenameTableDialogProps) => {
  const { connectionResource } = useRouteContext()
  const { tabId: activeTabId } = useParams({ strict: false })
  const store = getConnectionResourceStore(connectionResource.id)
  const router = useRouter()
  const [newTableName, setNewTableName] = useState('')
  const [schema, setSchema] = useState('')
  const [table, setTable] = useState('')
  const [open, setOpen] = useState(false)
  const isCurrentTable = activeTabId === tableTabId(schema, table)

  useImperativeHandle(ref, () => ({
    rename: (schemaName: string, tableName: string) => {
      setSchema(schemaName)
      setTable(tableName)
      setNewTableName(tableName)
      setOpen(true)
    },
  }))

  const { mutate: renameTable, isPending } = useMutation({
    mutationFn: async () => {
      await renameTableQuery({
        schema,
        oldTable: table,
        newTable: newTableName,
      }).run(await connectionResourceToQueryParams(connectionResource))
    },
    onSuccess: async () => {
      toast.success(
        `Table "${table}" successfully renamed to "${newTableName}"`
      )
      setOpen(false)

      await queryClient.invalidateQueries(
        resourceTablesAndSchemasQueryOptions({
          connectionResource,
          showSystem: store.get().showSystem,
        })
      )
      renameTableTab(connectionResource.id, schema, table, newTableName)

      if (isCurrentTable) {
        router.navigate({
          replace: true,
          to: '/connection/$resourceId/$tabId',
          params: {
            resourceId: connectionResource.id,
            tabId: tableTabId(schema, newTableName),
          },
        })
      }
    },
    onError: (error) => {
      toast.error(`Failed to rename table "${error.message}".`)
    },
  })

  const canConfirm =
    newTableName.trim() !== '' && newTableName.trim() !== table && !isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Table</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <RiInformationLine className="size-5" />
            <AlertTitle data-mask>Rename table &quot;{table}&quot;</AlertTitle>
            <AlertDescription data-mask>
              This will rename the table from &quot;{table}&quot; to the new
              name you specify. This action cannot be undone.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Label htmlFor="newTableName">Table name</Label>
            <Input
              id="newTableName"
              value={newTableName}
              placeholder="Enter new table name"
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => setNewTableName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canConfirm) {
                  renameTable()
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            disabled={!canConfirm}
            onClick={() => {
              if (canConfirm) {
                renameTable()
              }
            }}
          >
            <LoadingContent loading={isPending}>Rename Table</LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
