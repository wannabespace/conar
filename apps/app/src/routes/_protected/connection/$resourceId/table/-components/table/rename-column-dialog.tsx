import { RiInformationLine } from '@remixicon/react'
import { Alert, AlertDescription, AlertTitle } from '@tamery/ui/components/alert'
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
import { getRouteApi } from '@tanstack/react-router'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'

import {
  renameColumnQuery,
  resourceRowsQueryInfiniteOptions,
  resourceTableColumnsQueryOptions,
} from '~/entities/connection/queries'
import { connectionResourceToQueryParams } from '~/entities/connection/runtime'
import { queryClient } from '~/main'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

interface RenameColumnDialogProps {
  ref: React.RefObject<{
    rename: (schema: string, table: string, column: string) => void
  } | null>
}

export function RenameColumnDialog({ ref }: RenameColumnDialogProps) {
  const { connectionResource } = useRouteContext()
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
      await renameColumnQuery({
        schema,
        table,
        oldColumn: column,
        newColumn: newColumnName,
      }).run(await connectionResourceToQueryParams(connectionResource))
    },
    onSuccess: async () => {
      toast.success(`Column "${column}" successfully renamed to "${newColumnName}"`)
      setOpen(false)

      await queryClient.invalidateQueries(
        resourceTableColumnsQueryOptions({ connectionResource, table, schema }),
      )
      await queryClient.invalidateQueries({
        queryKey: resourceRowsQueryInfiniteOptions({
          connectionResource,
          table,
          schema,
          query: { filters: [], orderBy: {} },
        }).queryKey.slice(0, -1),
      })
    },
    onError: error => {
      toast.error(`Failed to rename column "${error.message}".`)
    },
  })

  const canConfirm = newColumnName.trim() !== '' && newColumnName.trim() !== column && !isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Column</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <RiInformationLine className="size-5 text-blue-500" />
            <AlertTitle data-mask>Rename column "{column}"</AlertTitle>
            <AlertDescription data-mask>
              This will rename the column from "{column}" to the new name you specify.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Label htmlFor="newColumnName">Column name</Label>
            <Input
              id="newColumnName"
              value={newColumnName}
              placeholder="Enter new column name"
              spellCheck={false}
              autoComplete="off"
              onChange={e => setNewColumnName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && canConfirm) {
                  renameColumn()
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={!canConfirm}
            onClick={() => {
              if (canConfirm) {
                renameColumn()
              }
            }}
          >
            <LoadingContent loading={isPending}>Rename Column</LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
