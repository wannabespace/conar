import { Button } from '@tamery/ui/components/button'
import { DialogClose, DialogFooter } from '@tamery/ui/components/dialog'
import { Field, FieldGroup, FieldLabel } from '@tamery/ui/components/field'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'

import type { TableSelection } from './tables-field'
import { TablesField } from './tables-field'
import type { CopyEnd } from './target-select'
import { CopyEndLabel, TargetSelect } from './target-select'

const FORM_ID = 'copy-database'

const getBlocker = (target: CopyEnd | null, selection: TableSelection) => {
  if (!target) {
    return 'Choose a database to copy to.'
  }
  if (selection?.size === 0) {
    return 'Choose what to copy.'
  }
  return null
}

export const CopyForm = ({
  onSelectionChange,
  onSubmit,
  onTargetChange,
  selection,
  source,
  target,
}: {
  onSelectionChange: (selection: TableSelection) => void
  onSubmit: (target: CopyEnd) => void
  onTargetChange: (target: CopyEnd) => void
  selection: TableSelection
  source: CopyEnd
  target: CopyEnd | null
}) => {
  const blocker = getBlocker(target, selection)

  return (
    <>
      <form
        id={FORM_ID}
        onSubmit={(e) => {
          e.preventDefault()
          if (target && !blocker) {
            onSubmit(target)
          }
        }}
      >
        <FieldGroup size="sm">
          <Field>
            <FieldLabel>To</FieldLabel>
            <TargetSelect
              source={source}
              target={target}
              onTargetChange={onTargetChange}
            />
          </Field>
          <Field>
            <FieldLabel>Copy</FieldLabel>
            <TablesField
              resource={source.resource}
              selection={selection}
              onSelectionChange={onSelectionChange}
            />
          </Field>
        </FieldGroup>
      </form>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="submit"
                form={FORM_ID}
                variant="destructive"
                disabled={!!blocker}
                focusableWhenDisabled
              />
            }
          >
            Copy and replace
          </TooltipTrigger>
          <TooltipContent>
            {blocker ?? (
              <span>
                Replaces what it copies in{' '}
                {target && <CopyEndLabel {...target} />}. If anything fails,
                nothing changes.
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      </DialogFooter>
    </>
  )
}
