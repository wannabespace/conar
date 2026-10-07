import type { ConnectionType } from '@tamery/shared/enums/connection-type'
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
import type { RenamedValue } from '~/core/queries/shared/inline-enum'
import type { DraftState, NewColumn } from '~/core/queries/tables/shape'

import { CommentField } from './column-comment-field'
import { ReferenceField } from './column-reference-field'
import { TypeField } from './column-type-field'
import { useColumnType } from './use-column-type'
import type { ColumnReference, ReferenceTarget } from './use-reference-targets'

interface EditableColumn extends NewColumn {
  // Set only by callers that save it; the Comment field shows only then.
  comment?: string | null
  foreign: boolean
  // Name in the database; differs from `name` while a rename is pending.
  id: string
  state?: DraftState
}

interface EditableTable {
  columns: Pick<EditableColumn, 'id' | 'name'>[]
  name: string
  state?: DraftState
}

export type SubmittedColumn = NewColumn & { comment: string | null }

export interface ColumnDialogRequest<
  Table extends EditableTable = EditableTable,
  Column extends EditableColumn = EditableColumn,
> {
  column: Column | null
  table: Table
}

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const FORM_ID = 'column-dialog'

const changed = (
  column: EditableColumn | null,
  next: SubmittedColumn,
  reference: ReferenceTarget | null
) =>
  column === null ||
  reference !== null ||
  next.name !== column.name ||
  next.type !== column.type ||
  next.nullable !== column.nullable ||
  next.comment !== (column.comment ?? null)

const submittedColumn = ({
  comment,
  primaryKey,
  ...column
}: NewColumn & { comment: string | null | undefined }): SubmittedColumn => ({
  ...column,
  comment: comment?.trim() || null,
  name: column.name.trim(),
  nullable: primaryKey ? false : column.nullable,
  primaryKey,
})

const errorsOf = (
  { column, table }: ColumnDialogRequest,
  next: NewColumn,
  enumValues: string[] | null,
  submitted: boolean
) => {
  const nameBecomesId = column === null || column.state === 'added'
  const taken = table.columns.some(
    (other) =>
      other.id !== column?.id &&
      (other.name === next.name || (nameBecomesId && other.id === next.name))
  )
  const missingName = submitted ? 'Give the column a name.' : undefined
  const missingValues =
    submitted && enumValues?.length === 0
      ? 'Add at least one value.'
      : undefined
  return {
    name: next.name
      ? taken && 'This table already has a column with this name'
      : missingName,
    type:
      submitted && !next.type ? "Pick or write the column's type." : undefined,
    values:
      enumValues && new Set(enumValues).size < enumValues.length
        ? 'Each value must be unique.'
        : missingValues,
  }
}

const lockedFields = (
  connectionType: ConnectionType,
  column: EditableColumn | null
) => {
  const { renameColumns, retypeKeyColumns } = capabilitiesOf(connectionType)
  const stored = column !== null && column.state !== 'added'
  return {
    name: stored && !renameColumns,
    type: stored && !!column.primaryKey && !retypeKeyColumns,
  }
}

const ColumnForm = ({
  onSubmit,
  pending,
  request,
}: {
  onSubmit: (
    column: SubmittedColumn,
    reference: ColumnReference | null,
    renamedValues: RenamedValue[]
  ) => void
  pending: boolean
  request: ColumnDialogRequest
}) => {
  const { column, table } = request
  const { connection } = useRouteContext()
  const [name, setName] = useState(column?.name ?? '')
  const columnType = useColumnType(connection.type, column?.type ?? '')
  const {
    array,
    arrayType,
    element,
    enumValues,
    renamedValues,
    setArray,
    setElement,
  } = columnType
  const [reference, setReference] = useState<ReferenceTarget | null>(null)
  const [nullable, setNullable] = useState(column?.nullable ?? true)
  const [primaryKey, setPrimaryKey] = useState(column?.primaryKey ?? false)
  const [comment, setComment] = useState(column?.comment)
  const [submitted, setSubmitted] = useState(false)
  const locked = lockedFields(connection.type, column)
  const next = submittedColumn({
    comment,
    name,
    nullable,
    primaryKey,
    type: columnType.type,
  })
  const errors = errorsOf(request, next, enumValues, submitted)

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
          const refused = errorsOf(request, next, enumValues, true)
          if (!refused.name && !refused.type && !refused.values) {
            onSubmit(next, reference, renamedValues)
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
              autoFocus={!locked.name}
              disabled={locked.name}
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
          autoFocus={locked.name && !locked.type}
          columnType={columnType}
          disabled={locked.type}
          error={errors.type}
          valuesError={errors.values}
        />
        <ReferenceField
          column={column}
          value={reference}
          onValueChange={(target) => {
            setReference(target)
            if (target && !element.trim()) {
              setElement(target.type)
            }
          }}
        />
        <CommentField value={comment} onValueChange={setComment} />
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
          disabled={pending || !changed(column, next, reference)}
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
    column: SubmittedColumn,
    reference: ColumnReference | null,
    renamedValues: RenamedValue[]
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
            onSubmit={(column, reference, renamedValues) =>
              onSubmit(shown, column, reference, renamedValues)
            }
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
