import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
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
import { getRouteApi } from '@tanstack/react-router'
import type { RefObject } from 'react'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'

import { resourceRowsQueryKey } from '~/core/queries/rows/list'
import { resourceColumnsQueryKey } from '~/core/queries/tables/columns'
import { renameColumnQuery } from '~/core/queries/tables/rename-columns'
import { connectionResourceToQueryParams } from '~/core/runtime/query'
import { queryClient } from '~/lib/query-client'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const RenameColumnDialog = ({
  ref,
}: {
  ref: RefObject<{
    rename: (schema: string, table: string, column: string) => void
  } | null>
}) => {
  const { connectionResource } = useRouteContext()
  const [target, setTarget] = useState({ column: '', schema: '', table: '' })
  const { column, schema, table } = target
  const [newColumnName, setNewColumnName] = useState('')
  const [open, setOpen] = useState(false)

  useImperativeHandle(ref, () => ({
    rename: (schemaName, tableName, columnName) => {
      setTarget({ column: columnName, schema: schemaName, table: tableName })
      setNewColumnName(columnName)
      setOpen(true)
    },
  }))

  const { mutate: renameColumn, isPending } = useMutation({
    meta: { event: 'column_renamed' },
    mutationFn: async () => {
      await renameColumnQuery({
        newColumn: newColumnName,
        oldColumn: column,
        schema,
        table,
      }).run(await connectionResourceToQueryParams(connectionResource))
    },
    onError: (error) => {
      toast.error(`Failed to rename column "${error.message}".`)
    },
    onSuccess: async () => {
      toast.success(
        `Column "${column}" successfully renamed to "${newColumnName}"`
      )
      setOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: resourceColumnsQueryKey({ connectionResource }),
        }),
        queryClient.invalidateQueries({
          queryKey: resourceRowsQueryKey({ connectionResource, schema, table }),
        }),
      ])
    },
  })

  const canConfirm =
    newColumnName.trim() !== '' && newColumnName.trim() !== column && !isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Column</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <HugeiconsIcon
              icon={InformationCircleIcon}
              strokeWidth={2}
              className="text-info size-5"
            />
            <AlertTitle data-mask>
              Rename column &quot;{column}&quot;
            </AlertTitle>
            <AlertDescription data-mask>
              This will rename the column from &quot;{column}&quot; to the new
              name you specify.
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
              onChange={(e) => setNewColumnName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canConfirm) {
                  renameColumn()
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button disabled={!canConfirm} onClick={() => renameColumn()}>
            <LoadingContent loading={isPending}>Rename Column</LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
