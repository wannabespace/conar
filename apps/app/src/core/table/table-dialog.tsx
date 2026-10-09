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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'

interface TableTarget {
  name: string
  schema: string
}

export interface TableDialogRequest<Table extends TableTarget = TableTarget> {
  schema: string
  table: Table | null
}

const FORM_ID = 'table-dialog'

const TableForm = ({
  children,
  description,
  isTaken,
  noun,
  onSubmit,
  pending,
  request: { schema: initialSchema, table },
  schemas: knownSchemas,
  shortcut,
}: {
  children?: ReactNode
  description?: ReactNode
  isTaken: (schema: string, name: string) => boolean
  noun: string
  onSubmit: (schema: string, name: string) => void
  pending: boolean
  request: TableDialogRequest
  schemas: string[]
  shortcut?: ReactNode
}) => {
  const schemas = knownSchemas.includes(initialSchema)
    ? knownSchemas
    : [initialSchema, ...knownSchemas]
  const nameRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(table?.name ?? '')
  const [schema, setSchema] = useState(initialSchema)
  const [submitted, setSubmitted] = useState(false)
  const trimmed = name.trim()
  const taken = trimmed !== table?.name && isTaken(schema, trimmed)
  let nameError: string | null = null
  if (taken) {
    nameError = 'A table or view with this name already exists'
  } else if (submitted && !trimmed) {
    nameError = `Give the ${noun} a name.`
  }
  const submit = (
    <Button
      type="submit"
      form={FORM_ID}
      disabled={pending || trimmed === table?.name}
    />
  )

  return (
    <>
      <DialogHeader>
        <DialogTitle>{table ? `Rename ${noun}` : `New ${noun}`}</DialogTitle>
        <DialogDescription>
          {table ? (
            <span data-mask>{`${table.schema}.${table.name}`}</span>
          ) : (
            description
          )}
        </DialogDescription>
      </DialogHeader>
      <form
        id={FORM_ID}
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (pending) {
            return
          }
          setSubmitted(true)
          if (trimmed && !taken) {
            onSubmit(schema, trimmed)
          } else {
            nameRef.current?.focus()
          }
        }}
      >
        {table === null && schemas.length > 1 && (
          <Field>
            <FieldLabel htmlFor="table-dialog-schema">Schema</FieldLabel>
            <Select value={schema} onValueChange={(v) => v && setSchema(v)}>
              <SelectTrigger
                id="table-dialog-schema"
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
          <FieldLabel htmlFor="table-dialog-name">Name</FieldLabel>
          <InputGroup>
            <InputGroupInput
              ref={nameRef}
              id="table-dialog-name"
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
        {children}
      </form>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Tooltip shortcut={!pending && shortcut}>
          <TooltipTrigger render={submit}>
            <LoadingContent loading={pending}>
              {table ? 'Rename' : `Create ${noun}`}
            </LoadingContent>
          </TooltipTrigger>
          {shortcut && <TooltipContent />}
        </Tooltip>
      </DialogFooter>
    </>
  )
}

export const TableDialog = <Table extends TableTarget>({
  children,
  description = 'The table is created with an id primary key.',
  isTaken,
  noun = 'table',
  onOpenChange,
  onSubmit,
  pending = false,
  request,
  schemas,
  shortcut,
}: {
  children?: ReactNode
  description?: ReactNode
  isTaken: (schema: string, name: string) => boolean
  noun?: string
  onOpenChange: (open: boolean) => void
  onSubmit: (
    request: TableDialogRequest<Table>,
    schema: string,
    name: string
  ) => void
  pending?: boolean
  request: TableDialogRequest<Table> | null
  schemas: string[]
  shortcut?: ReactNode
}) => {
  const [shown, setShown] = useState(request)
  if (request && request !== shown) {
    setShown(request)
  }

  return (
    <Dialog
      open={request !== null}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(open) => {
        if (!open) {
          setShown(null)
        }
      }}
    >
      <DialogContent>
        {shown && (
          <TableForm
            key={shown.table ? `${shown.table.schema}.${shown.table.name}` : ''}
            description={description}
            isTaken={isTaken}
            noun={noun}
            pending={pending}
            request={shown}
            schemas={schemas}
            shortcut={shortcut}
            onSubmit={(schema, name) => onSubmit(shown, schema, name)}
          >
            {children}
          </TableForm>
        )}
      </DialogContent>
    </Dialog>
  )
}
