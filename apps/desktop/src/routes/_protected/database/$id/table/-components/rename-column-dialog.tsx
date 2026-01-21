import type { connections } from '~/drizzle'
import { Alert, AlertDescription, AlertTitle } from '@conar/ui/components/alert'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@conar/ui/components/dialog'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { RiInformationLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { connectionRowsQuery } from '~/entities/connection/queries'
import { connectionTableColumnsQuery } from '~/entities/connection/queries/columns'
import { renameColumnQuery } from '~/entities/connection/sql/rename-columns'
import { queryClient } from '~/main'

interface RenameColumnDialogProps {
  ref: React.RefObject<{
    rename: (schema: string, table: string, column: string) => void
  } | null>
  connection: typeof connections.$inferSelect
}

export function RenameColumnDialog({ ref, connection }: RenameColumnDialogProps) {
  const [newColumnName, setNewColumnName] = useState('')
  const [schema, setSchema] = useState('')
  const [table, setTable] = useState('')
  const [column, setColumn] = useState('')
  const [open, setOpen] = useState(false)

  useImperativeHandle(ref, () => ({
    rename: (schema: string, table: string, column: string) => {
      setSchema(schema)
      setTable(table)
      setColumn(column)
      setNewColumnName(column)
      setOpen(true)
    },
  }))

  const { mutate: renameColumn, isPending } = useMutation({
    mutationFn: async () => {
      await renameColumnQuery(connection, {
        schema,
        table,
        oldColumn: column,
        newColumn: newColumnName,
      })
    },
    onSuccess: async () => {
      toast.success(`Column "${column}" successfully renamed to "${newColumnName}"`)
      setOpen(false)

      await queryClient.invalidateQueries(connectionTableColumnsQuery({ connection, table, schema }))
      await queryClient.invalidateQueries({
        queryKey: connectionRowsQuery({ connection, table, schema, query: { filters: [], orderBy: {} } }).queryKey.slice(0, -1),
      })
    },
    onError: (error) => {
      toast.error(`Failed to rename column: ${error.message}`)
    },
  })

  const canConfirm = newColumnName.trim() !== '' && newColumnName.trim() !== column && !isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Rename Column
          </DialogTitle>
          <div className="space-y-4">
            <Alert>
              <RiInformationLine className="size-5 text-blue-500" />
              <AlertTitle>
                Rename column "
                {column}
                "
              </AlertTitle>
              <AlertDescription>
                This will rename the column from "
                {column}
                " to the new name you specify.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="newColumnName" className="font-normal">
                Column name
              </Label>
              <Input
                id="newColumnName"
                value={newColumnName}
                placeholder="Enter new column name"
                spellCheck={false}
                autoComplete="off"
                onChange={e => setNewColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canConfirm) {
                    renameColumn()
                  }
                }}
              />
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-2">
          <DialogClose asChild>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={!canConfirm}
            onClick={() => {
              if (canConfirm) {
                renameColumn()
              }
            }}
          >
            <LoadingContent loading={isPending}>
              Rename Column
            </LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
