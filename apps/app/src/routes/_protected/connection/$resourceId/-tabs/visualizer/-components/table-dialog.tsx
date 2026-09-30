import { Button } from '@tamery/ui/components/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { useState } from 'react'

import type { DiagramTable } from '../-lib/schema'
import { tableNodeId } from '../-lib/schema'

export interface TableDialogRequest {
  schema: string
  table: DiagramTable | null
}

const FORM_ID = 'diagram-table'

const TableForm = ({
  onSubmit,
  request: { schema: initialSchema, table },
  schemas,
  tableIds,
}: {
  onSubmit: (schema: string, name: string) => void
  request: TableDialogRequest
  schemas: string[]
  tableIds: Set<string>
}) => {
  const [name, setName] = useState(table?.name ?? '')
  const [schema, setSchema] = useState(initialSchema)
  const [submitted, setSubmitted] = useState(false)
  const trimmed = name.trim()
  const taken =
    trimmed !== table?.name &&
    trimmed !== table?.table &&
    tableIds.has(tableNodeId(schema, trimmed))
  let nameError: string | null = null
  if (taken) {
    nameError =
      schemas.length > 1
        ? `${schema} already has a table with this name`
        : 'A table with this name already exists'
  } else if (submitted && !trimmed) {
    nameError = 'Give the table a name.'
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{table ? 'Rename table' : 'New table'}</DialogTitle>
        <DialogDescription>
          {table ? (
            <span data-mask>{`${table.schema}.${table.name}`}</span>
          ) : (
            'The table is created with an id primary key; add columns from its card.'
          )}
        </DialogDescription>
      </DialogHeader>
      <form
        id={FORM_ID}
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          setSubmitted(true)
          if (trimmed && !taken) {
            onSubmit(schema, trimmed)
          }
        }}
      >
        {table === null && schemas.length > 1 && (
          <Field>
            <FieldLabel htmlFor="diagram-table-schema">Schema</FieldLabel>
            <Select value={schema} onValueChange={(v) => v && setSchema(v)}>
              <SelectTrigger
                id="diagram-table-schema"
                data-mask
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent data-mask>
                {schemas.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {entry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="diagram-table-name">Name</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="diagram-table-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!nameError}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              data-mask
            />
            <InputGroupAddon align="inline-end">
              {nameError && <FieldError>{nameError}</FieldError>}
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </form>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" form={FORM_ID} disabled={trimmed === table?.name}>
          {table ? 'Rename' : 'Create table'}
        </Button>
      </DialogFooter>
    </>
  )
}

export const TableDialog = ({
  onOpenChange,
  onSubmit,
  request,
  schemas,
  tableIds,
}: {
  onOpenChange: (open: boolean) => void
  onSubmit: (request: TableDialogRequest, schema: string, name: string) => void
  request: TableDialogRequest | null
  schemas: string[]
  tableIds: Set<string>
}) => {
  const [shown, setShown] = useState(request)
  if (request && request !== shown) {
    setShown(request)
  }

  return (
    <Dialog open={request !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {shown && (
          <TableForm
            key={shown.table?.id ?? 'new'}
            request={shown}
            schemas={schemas}
            tableIds={tableIds}
            onSubmit={(schema, name) => onSubmit(shown, schema, name)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
