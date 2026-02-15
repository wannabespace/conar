import type { RefObject } from 'react'
import { Button } from '@conar/ui/components/button'
import { Command, CommandInput } from '@conar/ui/components/command'
import { Separator } from '@conar/ui/components/separator'
import { RiCornerDownLeftLine } from '@remixicon/react'

export function FilterValueSelector({
  ref,
  column,
  operator,
  values,
  isArray,
  onChange,
  onApply,
  onBackspace,
}: {
  ref?: RefObject<HTMLInputElement | null>
  column: string
  operator: string
  isArray: boolean
  values: unknown[]
  onChange: (value: string[]) => void
  onApply: () => void
  onBackspace?: () => void
}) {
  return (
    <Command>
      <div>
        <CommandInput
          ref={ref}
          value={isArray ? values.join(',') : values[0] as string}
          onValueChange={value => onChange(isArray ? value.split(',') : [value])}
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
        <div className="flex flex-col gap-4 p-4 text-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Filtering</span>
              <span className="font-medium text-primary">{column}</span>
            </div>
            <Separator />
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Operator</span>
              <span className={`
                rounded-md bg-muted px-2 py-0.5 text-xs font-medium
                text-muted-foreground
              `}
              >
                {operator}
              </span>
            </div>
          </div>
          {operator.toLowerCase().includes('like') && (
            <div className={`
              rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs
              text-foreground
            `}
            >
              <span className="font-semibold text-primary">Tip:</span>
              {' '}
              <span>
                Use
                <kbd className="
                  rounded-sm border bg-muted px-1.5 py-0.5 text-xs
                "
                >
                  %
                </kbd>
                {' '}
                as wildcard
              </span>
            </div>
          )}
          {operator.toLowerCase().includes('in') && (
            <div className={`
              rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs
              text-foreground
            `}
            >
              <span className="font-semibold text-primary">Tip:</span>
              {' '}
              <span>
                Separate multiple values with commas
                {' '}
                <kbd className="
                  rounded-sm border bg-muted px-1.5 py-0.5 text-xs
                "
                >
                  ,
                </kbd>
              </span>
            </div>
          )}
          {operator.toLowerCase().includes('between') && (
            <div className={`
              rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs
              text-foreground
            `}
            >
              <span className="font-semibold text-primary">Tip:</span>
              {' '}
              <span>
                Separate range values with
                {' '}
                <kbd className="
                  rounded-sm border bg-muted px-1.5 py-0.5 text-xs
                "
                >
                  AND
                </kbd>
              </span>
            </div>
          )}
        </div>
        <div className="flex justify-end border-t p-2">
          <Button
            onClick={onApply}
            size="xs"
          >
            Apply Filter
            <RiCornerDownLeftLine className="size-3" />
          </Button>
        </div>
      </div>
    </Command>
  )
}
