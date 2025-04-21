import type { ComponentProps } from 'react'
import { cn } from '@connnect/ui/lib/utils'
import { RiCheckLine, RiSubtractLine } from '@remixicon/react'

export function IndeterminateCheckbox({
  indeterminate,
  className,
  ...props
}: { indeterminate?: boolean } & ComponentProps<'input'>) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <input
        type="checkbox"
        className={cn(
          'peer appearance-none size-4 rounded-[4px] border border-border transition-colors outline-none duration-100',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'checked:bg-primary checked:border-primary disabled:opacity-50 disabled:cursor-not-allowed',
          !props.checked && indeterminate && 'bg-primary border-primary',
          className,
        )}
        {...props}
      />
      <RiCheckLine
        className={cn(
          'absolute size-3 text-primary-foreground opacity-0 pointer-events-none peer-checked:opacity-100 transition-opacity duration-100',
        )}
      />
      <RiSubtractLine
        className="absolute size-3 text-primary-foreground opacity-0 pointer-events-none transition-opacity duration-100"
        style={{ opacity: !props.checked && indeterminate ? 1 : 0 }}
      />
    </div>
  )
}
