import type { InputProps } from '@conar/ui/components/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@conar/ui/components/input-group'
import { cn } from '@conar/ui/lib/utils'
import { RiCloseLine } from '@remixicon/react'
import { Button } from '../button'

export function SearchInput({ className, value, onClear, ...props }: InputProps & {
  onClear: () => void
}) {
  const hasValue = typeof value === 'string' ? value.length > 0 : Boolean(value)

  return (
    <InputGroup className={cn(className)}>
      <InputGroupInput
        value={value}
        {...props}
      />
      {hasValue && (
        <InputGroupAddon align="inline-end">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClear}
          >
            <RiCloseLine />
          </Button>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}
