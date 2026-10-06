import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@tamery/ui/components/dialog'
import { Field, FieldError, FieldLabel } from '@tamery/ui/components/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@tamery/ui/components/input-group'
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

import { useTableColumnsContext } from '../../lib/columns'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const FORM_ID = 'rename-column-dialog'

export const RenameColumnDialog = ({
  ref,
}: {
  ref: RefObject<{
    rename: (schema: string, table: string, column: string) => void
  } | null>
}) => {
  const { connectionResource } = useRouteContext()
  const { columns } = useTableColumnsContext()
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

  const trimmed = newColumnName.trim()
  const taken =
    trimmed !== column && columns.some((other) => other.id === trimmed)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename column</DialogTitle>
          <DialogDescription>
            <span data-mask>{`${table}.${column}`}</span>
          </DialogDescription>
        </DialogHeader>
        <form
          id={FORM_ID}
          onSubmit={(e) => {
            e.preventDefault()
            if (trimmed && !taken && trimmed !== column) {
              renameColumn()
            }
          }}
        >
          <Field>
            <FieldLabel htmlFor="rename-column-name">Name</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="rename-column-name"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                aria-invalid={taken}
                autoFocus
                spellCheck={false}
                autoComplete="off"
                data-mask
              />
              <InputGroupAddon align="inline-end">
                {taken && (
                  <FieldError>
                    A column with this name already exists
                  </FieldError>
                )}
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </form>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="submit"
            form={FORM_ID}
            disabled={isPending || !trimmed || trimmed === column}
          >
            <LoadingContent loading={isPending}>Rename</LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
