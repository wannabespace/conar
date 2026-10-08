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

import { CommentField } from './column-comment-field'
import { ReferenceField } from './column-reference-field'
import { TypeField } from './column-type-field'
import type {
  EditableColumn,
  EditableTable,
  SubmittedColumn,
} from './submitted-column'
import { changed, errorsOf, normalized } from './submitted-column'
import { useColumnType } from './use-column-type'
import type { ColumnReference, ReferenceTarget } from './use-reference-targets'

export interface ColumnDialogRequest<
  Table extends EditableTable = EditableTable,
  Column extends EditableColumn = EditableColumn,
> {
  column: Column | null
  table: Table
}

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const FORM_ID = 'column-dialog'

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
  const next = normalized(column, {
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
        {comment !== undefined && (
          <CommentField value={comment} onValueChange={setComment} />
        )}
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
