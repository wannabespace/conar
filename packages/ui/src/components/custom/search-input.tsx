import type { ComponentProps } from 'react'
import { Input } from '@conar/ui/components/input'
import { cn } from '@conar/ui/lib/utils'
import { RiCloseLine } from '@remixicon/react'

export function SearchInput({ className, value, onClear, ...props }: ComponentProps<typeof Input> & {
  onClear: () => void
}) {
  return (
    <div className="relative">
      <Input
        className={cn('pr-8', className)}
        value={value}
        {...props}
      />
      {value && (
        <button
          type="button"
          className="
            absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer p-1
          "
          onClick={onClear}
        >
          <RiCloseLine className="size-4 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}
