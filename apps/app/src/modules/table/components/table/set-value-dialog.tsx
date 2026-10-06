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
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'

import type { Column } from '~/core/table/cell/utils'
import { canWriteDefault } from '~/core/table/cell/utils'
import { parseCellText } from '~/core/transformers/create-transformer'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const FORM_ID = 'set-value-dialog'

const SetValueForm = ({
  column,
  count,
  onSet,
}: {
  column: Column
  count: number
  onSet: (value: unknown) => void
}) => {
  const { connection } = useRouteContext()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const canDefault = canWriteDefault(connection.type, column)

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          Set <span data-mask>{column.id}</span> in {count} row
          {count === 1 ? '' : 's'}
        </DialogTitle>
        <DialogDescription>
          Staged as changes; review and save them from the toolbar.
        </DialogDescription>
      </DialogHeader>
      <form
        id={FORM_ID}
        onSubmit={(event) => {
          event.preventDefault()
          const { data, error: parseError } = parseCellText(
            connection.type,
            column,
            text
          )
          if (parseError) {
            setError(parseError.message)
          } else {
            onSet(data)
          }
        }}
      >
        <Field>
          <FieldLabel htmlFor="set-value-dialog-value">Value</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="set-value-dialog-value"
              value={text}
              onChange={(event) => {
                setText(event.target.value)
                setError(null)
              }}
              aria-invalid={!!error}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              data-mask
            />
            <InputGroupAddon align="inline-end">
              {error && <FieldError>{error}</FieldError>}
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </form>
      <DialogFooter>
        {column.isNullable && (
          <Button type="button" variant="ghost" onClick={() => onSet(null)}>
            Set null
          </Button>
        )}
        {canDefault && (
          <Button
            type="button"
            variant="ghost"
            // oxlint-disable-next-line unicorn/no-useless-undefined -- `undefined` is the DEFAULT draft, not a missing value
            onClick={() => onSet(undefined)}
          >
            Default
          </Button>
        )}
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" form={FORM_ID}>
          Set Value
        </Button>
      </DialogFooter>
    </>
  )
}

export const SetValueDialog = ({
  column,
  count,
  onClose,
  onSet,
}: {
  column: Column | null
  count: number
  onClose: () => void
  onSet: (column: Column, value: unknown) => void
}) => {
  const [shown, setShown] = useState(column)
  if (column && column !== shown) {
    setShown(column)
  }

  return (
    <Dialog open={column !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {shown && (
          <SetValueForm
            key={shown.id}
            column={shown}
            count={count}
            onSet={(value) => {
              onSet(shown, value)
              onClose()
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
