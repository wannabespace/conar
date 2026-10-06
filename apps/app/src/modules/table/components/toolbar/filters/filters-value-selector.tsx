import { Button } from '@tamery/ui/components/button'
import { Command, CommandInput } from '@tamery/ui/components/command'
import { EnterIcon } from '@tamery/ui/components/custom/shortcuts'
import { Kbd } from '@tamery/ui/components/kbd'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import type { Ref } from 'react'

const hintFor = (operator: string, isArray: boolean) => {
  if (isArray) {
    return 'Separate values with commas'
  }
  if (operator.toLowerCase().includes('like')) {
    return '% matches any text'
  }
  return null
}

export const FiltersValueSelector = ({
  ref,
  column,
  operator,
  values,
  isArray,
  onChange,
  onApply,
  onBackspace,
}: {
  ref?: Ref<HTMLInputElement>
  column: string
  operator: string
  isArray: boolean
  values: unknown[]
  onChange: (value: string[]) => void
  onApply: () => void
  onBackspace?: () => void
}) => {
  const hint = hintFor(operator, isArray)

  return (
    <Command>
      <CommandInput
        ref={ref}
        value={isArray ? values.join(',') : (values[0] as string)}
        onValueChange={(value) =>
          onChange(isArray ? value.split(',') : [value])
        }
        placeholder={`Enter value for ${column}...`}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onApply()
          }
          if (e.key === 'Backspace') {
            onBackspace?.()
          }
        }}
      />
      <div className="flex items-center gap-2 p-1 pl-3">
        <div className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
          <span data-mask className="text-foreground font-medium">
            {column}
          </span>{' '}
          {operator}
          {hint && ` · ${hint}`}
        </div>
        <Tooltip
          shortcut={
            <Kbd>
              <EnterIcon />
            </Kbd>
          }
        >
          <TooltipTrigger render={<Button onClick={onApply} size="xs" />}>
            Apply
          </TooltipTrigger>
          <TooltipContent>Apply filter</TooltipContent>
        </Tooltip>
      </div>
    </Command>
  )
}
