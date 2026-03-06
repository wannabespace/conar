import { Alert, AlertDescription, AlertTitle } from '@conar/ui/components/alert'
import { Button } from '@conar/ui/components/button'
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
import { RiInformationLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { connectionTablesAndSchemasQuery } from '~/entities/connection/queries'
import { renameTableQuery } from '~/entities/connection/sql'
import { connectionStore, renameTab } from '~/entities/connection/store'
import { queryClient } from '~/main'
import { Route } from '..'

interface RenameTableDialogProps {
  ref: React.RefObject<{
    rename: (schema: string, table: string) => void
  } | null>
}

export function RenameTableDialog({ ref }: RenameTableDialogProps) {
  const { connection } = Route.useRouteContext()
  const store = connectionStore(connection.id)
  const router = useRouter()
  const [newTableName, setNewTableName] = useState('')
  const [schema, setSchema] = useState('')
  const [table, setTable] = useState('')
  const [open, setOpen] = useState(false)

  useImperativeHandle(ref, () => ({
    rename: (schema: string, table: string) => {
      setSchema(schema)
      setTable(table)
      setNewTableName(table)
      setOpen(true)
    },
  }))

  const { mutate: renameTable, isPending } = useMutation({
    mutationFn: async () => {
      await renameTableQuery(connection, { schema, oldTable: table, newTable: newTableName })
    },
    onSuccess: async () => {
      toast.success(`Table "${table}" successfully renamed to "${newTableName}"`)
      setOpen(false)

      await queryClient.invalidateQueries(connectionTablesAndSchemasQuery({ connection, showSystem: store.state.showSystem }))
      renameTab(connection.id, schema, table, newTableName)

      router.navigate({
        replace: true,
        to: '/database/$id/table',
        params: { id: connection.id },
        search: { schema, table: newTableName },
      })
    },
    onError: (error) => {
      toast.error(`Failed to rename table "${error.message}".`)
    },
  })

  const canConfirm = newTableName.trim() !== '' && newTableName.trim() !== table && !isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Rename Table
          </DialogTitle>
        </DialogHeader>
        <DialogPanel className="space-y-4">
          <Alert>
            <RiInformationLine className="size-5" />
            <AlertTitle>
              Rename table "
              {table}
              "
            </AlertTitle>
            <AlertDescription>
              This will rename the table from "
              {table}
              " to the new name you specify. This action cannot be undone.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Label htmlFor="newTableName">
              Table name
            </Label>
            <Input
              id="newTableName"
              value={newTableName}
              placeholder="Enter new table name"
              spellCheck={false}
              autoComplete="off"
              onChange={e => setNewTableName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canConfirm) {
                  renameTable()
                }
              }}
            />
          </div>
        </DialogPanel>
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
            <LoadingContent loading={isPending}>
              Rename Table
            </LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
