import { DatabaseRestoreIcon, EraserIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { KbdCtrlEnter } from '@tamery/ui/components/custom/shortcuts'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'

import type { CellEdit } from '../cursor'
import { useGridCursorContext } from '../cursor'
import type { Column } from './utils'
import { canWriteDefault } from './utils'

export const CellFieldActions = ({
  canApply,
  column,
  edit,
  value,
}: {
  canApply: boolean
  column: Column
  edit: CellEdit | null
  value: unknown
}) => {
  const cursor = useGridCursorContext()
  const canDefault = canWriteDefault(cursor.connectionType, column)
  if (!column.isNullable && !canApply && !canDefault) {
    return null
  }

  return (
    <div className="flex shrink-0 items-center justify-between gap-1 border-t p-1">
      {column.isNullable && (
        <Button
          variant="ghost-muted"
          size="xs"
          disabled={value === null && edit?.text === null}
          onClick={() => cursor.set(null)}
        >
          <HugeiconsIcon
            icon={EraserIcon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          Set null
        </Button>
      )}
      {canDefault && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost-muted"
                size="xs"
                disabled={value === undefined}
                // oxlint-disable-next-line unicorn/no-useless-undefined -- `undefined` is the DEFAULT draft, not a missing value
                onClick={() => cursor.set(undefined)}
              />
            }
          >
            <HugeiconsIcon
              icon={DatabaseRestoreIcon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Default
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span data-mask className="font-mono">
              {column.defaultValue}
            </span>
          </TooltipContent>
        </Tooltip>
      )}
      {canApply && (
        <Tooltip shortcut={<KbdCtrlEnter userAgent={navigator.userAgent} />}>
          <TooltipTrigger
            render={
              <Button
                size="xs"
                className="ml-auto"
                onClick={() => cursor.fill()}
              />
            }
          >
            Apply
          </TooltipTrigger>
          <TooltipContent side="bottom">Apply with</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
