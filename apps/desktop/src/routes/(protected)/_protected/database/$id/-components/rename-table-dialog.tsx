import type { Database } from '~/lib/indexeddb'
import { renameTableSql } from '@conar/shared/sql/rename-table'
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
import { tablesAndSchemasQuery } from '~/entities/database'
import { dbQuery } from '~/lib/query'
import { queryClient } from '~/main'
import { renameTab } from '../-lib/tabs'

interface RenameTableDIalogProps {
  ref: React.RefObject<{
    rename: (schema: string, table: string) => void
  } | null>
  database: Database
}

export function RenameTableDIalog({ ref, database }: RenameTableDIalogProps) {
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
      await dbQuery({
        type: database.type,
        connectionString: database.connectionString,
        query: renameTableSql(schema, table, newTableName)[database.type],
      })
    },
    onSuccess: async () => {
      toast.success(`Table "${table}" successfully renamed to "${newTableName}"`)
      setOpen(false)

      await queryClient.invalidateQueries(tablesAndSchemasQuery(database))
      renameTab(database.id, schema, table, newTableName)

      router.navigate({
        replace: true,
        to: '/database/$id/tables/$schema/$table',
        params: { id: database.id, schema, table: newTableName },
      })
    },
  })

  const canConfirm = newTableName.trim() !== '' && newTableName.trim() !== table

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
                onChange={e => setNewTableName(e.target.value)}
                placeholder="Enter new table name"
                spellCheck={false}
                autoComplete="off"
                autoFocus
              />
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-2">
          <DialogClose asChild>
            <Button
              variant="outline"
              onClick={() => setNewTableName('')}
              className="rounded-lg border border-input bg-background hover:bg-muted/70 text-foreground font-medium px-5 py-2 transition-all focus:ring-2 focus:ring-primary/20"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={() => renameTable()}
            disabled={!canConfirm || isPending}
            className="rounded-lg bg-primary text-primary-foreground font-semibold px-5 py-2 hover:bg-primary/90 transition-all focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
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
