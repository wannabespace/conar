import { Button } from '@tamery/ui/components/button'
import { Checkbox } from '@tamery/ui/components/checkbox'
import {
  Combobox,
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

const submittable = (column: DiagramColumn | null, next: NewColumn) =>
  !!next.name &&
  !!next.type &&
  (column === null ||
    next.name !== column.name ||
    next.type !== column.type ||
    next.nullable !== column.nullable)

const ColumnForm = ({
  canRename,
  columnTypes,
  onSubmit,
  request: { column, table },
}: {
  canRename: boolean
  columnTypes: readonly string[]
  onSubmit: (column: NewColumn) => void
  request: ColumnDialogRequest
}) => {
  const [name, setName] = useState(column?.name ?? '')
  const [type, setType] = useState(column?.type ?? '')
  const [nullable, setNullable] = useState(column?.nullable ?? true)
  const [primaryKey, setPrimaryKey] = useState(column?.primaryKey ?? false)
  const nameLocked = column !== null && !canRename && column.state !== 'added'
  const next: NewColumn = {
    name: name.trim(),
    nullable: primaryKey ? false : nullable,
    primaryKey,
    type: type.trim(),
  }
  const taken = table.columns.some(
    (other) => other.name === next.name && other.id !== column?.id
  )
  const canSubmit = !taken && submittable(column, next)

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
          if (canSubmit) {
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
              aria-invalid={taken}
              autoFocus={!nameLocked}
              disabled={nameLocked}
              spellCheck={false}
              autoComplete="off"
              data-mask
            />
            <InputGroupAddon align="inline-end">
              {taken && (
                <FieldError>
                  This table already has a column with this name
                </FieldError>
              )}
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="diagram-column-type">Type</FieldLabel>
          <Combobox
            items={columnTypes}
            inputValue={type}
            onInputValueChange={setType}
          >
            <ComboboxInput
              id="diagram-column-type"
              autoFocus={nameLocked}
              spellCheck={false}
              autoComplete="off"
              placeholder="integer, varchar(255)…"
              className="w-full"
              data-mask
            />
            <ComboboxContent data-mask className="data-empty:hidden">
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Field>
        <div className="flex items-center gap-2">
          <Checkbox
            id="diagram-column-nullable"
            checked={primaryKey ? false : nullable}
            disabled={primaryKey}
            onCheckedChange={(checked) => setNullable(checked === true)}
          />
          <Label htmlFor="diagram-column-nullable" className="font-normal">
            Allow NULL
          </Label>
        </div>
        {column === null && table.state === 'added' && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="diagram-column-pk"
              checked={primaryKey}
              onCheckedChange={(checked) => setPrimaryKey(checked === true)}
            />
            <Label htmlFor="diagram-column-pk" className="font-normal">
              Primary key
            </Label>
          </div>
        )}
      </form>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" form={FORM_ID} disabled={!canSubmit}>
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
}) => (
  <Dialog open={request !== null} onOpenChange={onOpenChange}>
    <DialogContent>
      {request && (
        <ColumnForm
          key={`${request.table.id}:${request.column?.id ?? ''}`}
          canRename={canRename}
          columnTypes={columnTypes}
          request={request}
          onSubmit={(column) => onSubmit(request, column)}
        />
      )}
    </DialogContent>
  </Dialog>
)
