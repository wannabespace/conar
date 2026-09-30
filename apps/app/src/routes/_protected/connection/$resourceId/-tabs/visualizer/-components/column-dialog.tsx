import { Button } from '@tamery/ui/components/button'
import { Checkbox } from '@tamery/ui/components/checkbox'
import {
  Autocomplete,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@tamery/ui/components/combobox'
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
import { Label } from '@tamery/ui/components/label'
import { useState } from 'react'

import type { NewColumn } from '~/entities/connection/queries/tables/shape'

import type { DiagramColumn, DiagramTable } from '../-lib/schema'

export interface ColumnDialogRequest {
  column: DiagramColumn | null
  table: DiagramTable
}

const FORM_ID = 'diagram-column'

const changed = (column: DiagramColumn | null, next: NewColumn) =>
  column === null ||
  next.name !== column.name ||
  next.type !== column.type ||
  next.nullable !== column.nullable

const errorsOf = (
  { column, table }: ColumnDialogRequest,
  next: NewColumn,
  submitted: boolean
) => {
  const nameBecomesId = column === null || column.state === 'added'
  const taken = table.columns.some(
    (other) =>
      other.id !== column?.id &&
      (other.name === next.name || (nameBecomesId && other.id === next.name))
  )
  const missingName = submitted ? 'Give the column a name.' : undefined
  return {
    name: next.name
      ? taken && 'This table already has a column with this name'
      : missingName,
    type:
      submitted && !next.type ? "Pick or write the column's type." : undefined,
  }
}

const ColumnForm = ({
  canRename,
  columnTypes,
  onSubmit,
  request,
}: {
  canRename: boolean
  columnTypes: readonly string[]
  onSubmit: (column: NewColumn) => void
  request: ColumnDialogRequest
}) => {
  const { column, table } = request
  const [name, setName] = useState(column?.name ?? '')
  const [type, setType] = useState(column?.type ?? '')
  const [nullable, setNullable] = useState(column?.nullable ?? true)
  const [primaryKey, setPrimaryKey] = useState(column?.primaryKey ?? false)
  const [submitted, setSubmitted] = useState(false)
  const nameLocked = column !== null && !canRename && column.state !== 'added'
  const next: NewColumn = {
    name: name.trim(),
    nullable: primaryKey ? false : nullable,
    primaryKey,
    type: type.trim(),
  }
  const errors = errorsOf(request, next, submitted)

  return (
    <>
      <DialogHeader>
        <DialogTitle>{column ? 'Edit column' : 'Add column'}</DialogTitle>
        <DialogDescription data-mask>
          {column ? `${table.name}.${column.name}` : table.name}
        </DialogDescription>
      </DialogHeader>
      <form
        id={FORM_ID}
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          setSubmitted(true)
          const refused = errorsOf(request, next, true)
          if (!refused.name && !refused.type) {
            onSubmit(next)
          }
        }}
      >
        <Field>
          <FieldLabel htmlFor="diagram-column-name">Name</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="diagram-column-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!errors.name}
              autoFocus={!nameLocked}
              disabled={nameLocked}
              spellCheck={false}
              autoComplete="off"
              data-mask
            />
            <InputGroupAddon align="inline-end">
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="diagram-column-type">Type</FieldLabel>
          <Autocomplete
            items={columnTypes}
            value={type}
            onValueChange={setType}
          >
            <ComboboxInput
              id="diagram-column-type"
              aria-invalid={!!errors.type}
              autoFocus={nameLocked}
              spellCheck={false}
              autoComplete="off"
              placeholder="integer, varchar(255)…"
              className="w-full"
              data-mask
            >
              {errors.type && (
                <InputGroupAddon align="inline-end">
                  <FieldError>{errors.type}</FieldError>
                </InputGroupAddon>
              )}
            </ComboboxInput>
            <ComboboxContent>
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Autocomplete>
        </Field>
        <Label className="font-normal">
          <Checkbox
            checked={primaryKey ? false : nullable}
            disabled={primaryKey}
            onCheckedChange={(checked) => setNullable(checked === true)}
          />
          Allow NULL
        </Label>
        {column === null && table.state === 'added' && (
          <Label className="font-normal">
            <Checkbox
              checked={primaryKey}
              onCheckedChange={(checked) => setPrimaryKey(checked === true)}
            />
            Primary key
          </Label>
        )}
      </form>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" form={FORM_ID} disabled={!changed(column, next)}>
          {column ? 'Save' : 'Add column'}
        </Button>
      </DialogFooter>
    </>
  )
}

export const ColumnDialog = ({
  canRename,
  columnTypes,
  onOpenChange,
  onSubmit,
  request,
}: {
  canRename: boolean
  columnTypes: readonly string[]
  onOpenChange: (open: boolean) => void
  onSubmit: (request: ColumnDialogRequest, column: NewColumn) => void
  request: ColumnDialogRequest | null
}) => {
  const [shown, setShown] = useState(request)
  if (request && request !== shown) {
    setShown(request)
  }

  return (
    <Dialog open={request !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {shown && (
          <ColumnForm
            key={`${shown.table.id}:${shown.column?.id ?? ''}`}
            canRename={canRename}
            columnTypes={columnTypes}
            request={shown}
            onSubmit={(column) => onSubmit(shown, column)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
