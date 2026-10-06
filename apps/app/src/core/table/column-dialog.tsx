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
import { Switch } from '@tamery/ui/components/switch'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'

import { OptionField } from '~/components/option-field'
import { capabilitiesOf } from '~/core/catalog/capabilities'
import type { DraftState, NewColumn } from '~/core/queries/tables/shape'

import { arrayTypes, TypeField } from './column-type-field'

interface EditableColumn extends NewColumn {
  // Name in the database; differs from `name` while a rename is pending.
  id: string
  state?: DraftState
}

interface EditableTable {
  columns: Pick<EditableColumn, 'id' | 'name'>[]
  name: string
  state?: DraftState
}

export interface ColumnDialogRequest<
  Table extends EditableTable = EditableTable,
  Column extends EditableColumn = EditableColumn,
> {
  column: Column | null
  table: Table
}

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const FORM_ID = 'column-dialog'

const changed = (column: EditableColumn | null, next: NewColumn) =>
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
  onSubmit,
  pending,
  request,
}: {
  onSubmit: (column: NewColumn) => void
  pending: boolean
  request: ColumnDialogRequest
}) => {
  const { column, table } = request
  const { connection } = useRouteContext()
  const {
    columnTypes: { array: arrayType },
    renameColumns,
  } = capabilitiesOf(connection.type)
  const [name, setName] = useState(column?.name ?? '')
  const initialType = arrayTypes.split(arrayType, column?.type ?? '')
  const [type, setType] = useState(initialType.element)
  const [array, setArray] = useState(initialType.array)
  const [nullable, setNullable] = useState(column?.nullable ?? true)
  const [primaryKey, setPrimaryKey] = useState(column?.primaryKey ?? false)
  const [submitted, setSubmitted] = useState(false)
  const nameLocked =
    column !== null && !renameColumns && column.state !== 'added'
  const next: NewColumn = {
    name: name.trim(),
    nullable: primaryKey ? false : nullable,
    primaryKey,
    type: arrayTypes.join(arrayType, array, type.trim()),
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
          <FieldLabel htmlFor="column-dialog-name">Name</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="column-dialog-name"
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
        <TypeField
          autoFocus={nameLocked}
          error={errors.type}
          value={type}
          onValueChange={setType}
        />
        {column === null && table.state === 'added' && (
          <OptionField
            htmlFor="column-dialog-primary-key"
            title="Primary key"
            description="Identifies each row, so it never holds NULL."
          >
            <Switch
              id="column-dialog-primary-key"
              size="sm"
              checked={primaryKey}
              onCheckedChange={setPrimaryKey}
            />
          </OptionField>
        )}
        <OptionField
          htmlFor="column-dialog-nullable"
          title="Allow NULL"
          description="Rows may leave this column empty."
        >
          <Switch
            id="column-dialog-nullable"
            size="sm"
            checked={next.nullable}
            disabled={primaryKey}
            onCheckedChange={setNullable}
          />
        </OptionField>
        {arrayType && (
          <OptionField
            htmlFor="column-dialog-array"
            title="Array"
            description="Each value is a list of the type above."
          >
            <Switch
              id="column-dialog-array"
              size="sm"
              checked={array}
              onCheckedChange={setArray}
            />
          </OptionField>
        )}
      </form>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button
          type="submit"
          form={FORM_ID}
          disabled={pending || !changed(column, next)}
        >
          <LoadingContent loading={pending}>
            {column ? 'Save' : 'Add column'}
          </LoadingContent>
        </Button>
      </DialogFooter>
    </>
  )
}

export const ColumnDialog = <
  Table extends EditableTable,
  Column extends EditableColumn,
>({
  onOpenChange,
  onSubmit,
  pending = false,
  request,
}: {
  onOpenChange: (open: boolean) => void
  onSubmit: (
    request: ColumnDialogRequest<Table, Column>,
    column: NewColumn
  ) => void
  pending?: boolean
  request: ColumnDialogRequest<Table, Column> | null
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
            key={`${shown.table.name}:${shown.column?.id ?? ''}`}
            pending={pending}
            request={shown}
            onSubmit={(column) => onSubmit(shown, column)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
