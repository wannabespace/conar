import type { databases } from '~/drizzle'
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
import { useRouter } from '@tanstack/react-router'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { renameTableSql, tablesAndSchemasQuery } from '~/entities/database'
import { queryClient } from '~/main'
import { renameTab } from '../../../-store'

interface RenameTableDialogProps {
  ref: React.RefObject<{
    rename: (schema: string, table: string) => void
  } | null>
  database: typeof databases.$inferSelect
}

export function RenameTableDialog({ ref, database }: RenameTableDialogProps) {
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
      await renameTableSql(database, { schema, oldTable: table, newTable: newTableName })
    },
    onSuccess: async () => {
      toast.success(`Table "${table}" successfully renamed to "${newTableName}"`)
      setOpen(false)

      await queryClient.invalidateQueries(tablesAndSchemasQuery({ database }))
      renameTab(database.id, schema, table, newTableName)

      router.navigate({
        replace: true,
        to: '/database/$id/table',
        params: { id: database.id },
        search: { schema, table: newTableName },
      })
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
          <div className="space-y-4">
            <Alert>
              <RiInformationLine className="size-5 text-blue-500" />
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
              <Label htmlFor="newTableName" className="font-normal">
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
