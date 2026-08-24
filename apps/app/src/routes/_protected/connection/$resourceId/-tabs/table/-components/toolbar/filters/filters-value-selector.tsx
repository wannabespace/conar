import { RiCornerDownLeftLine } from '@remixicon/react'
import { Button } from '@tamery/ui/components/button'
import { Command, CommandInput } from '@tamery/ui/components/command'
import { Separator } from '@tamery/ui/components/separator'
import type { Ref } from 'react'

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
}) => (
  <Command>
    <div>
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
      <div className="flex flex-col gap-4 p-4 text-sm">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Filtering</span>
            <span data-mask className="text-primary font-medium">
              {column}
            </span>
          </div>
          <Separator />
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Operator</span>
            <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs font-medium">
              {operator}
            </span>
          </div>
        </div>
        {operator.toLowerCase().includes('like') && (
          <div className="border-primary/20 bg-primary/5 text-foreground rounded-md border px-3 py-2 text-xs">
            <span className="text-primary font-semibold">Tip:</span>{' '}
            <span>
              Use
              <kbd className="bg-muted rounded-sm border px-1.5 py-0.5 text-xs">
                %
              </kbd>{' '}
              as wildcard
            </span>
          </div>
        )}
        {operator.toLowerCase().includes('in') && (
          <div className="border-primary/20 bg-primary/5 text-foreground rounded-md border px-3 py-2 text-xs">
            <span className="text-primary font-semibold">Tip:</span>{' '}
            <span>
              Separate multiple values with commas{' '}
              <kbd className="bg-muted rounded-sm border px-1.5 py-0.5 text-xs">
                ,
              </kbd>
            </span>
          </div>
        )}
        {operator.toLowerCase().includes('between') && (
          <div className="border-primary/20 bg-primary/5 text-foreground rounded-md border px-3 py-2 text-xs">
            <span className="text-primary font-semibold">Tip:</span>{' '}
            <span>
              Separate range values with{' '}
              <kbd className="bg-muted rounded-sm border px-1.5 py-0.5 text-xs">
                AND
              </kbd>
            </span>
          </div>
        )}
      </div>
      <div className="flex justify-end border-t p-2">
        <Button onClick={onApply} size="xs">
          Apply Filter
          <RiCornerDownLeftLine className="size-3" />
        </Button>
      </div>
    </div>
  </Command>
)
