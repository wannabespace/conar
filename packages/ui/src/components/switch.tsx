import type * as React from 'react'
import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import { cn } from '@conar/ui/lib/utils'

export function Switch({
  className,
  ...props
}: SwitchPrimitive.Root.Props): React.ReactElement {
  return (
    <SwitchPrimitive.Root
      className={cn(
        `
          inline-flex h-[calc(var(--thumb-size)+0.125rem)]
          w-[calc(var(--thumb-size)*2-0.125rem)] shrink-0 items-center
          rounded-full p-(--border-hairline)
          transition-[background-color,box-shadow] duration-200 outline-none
          [--thumb-size:--spacing(5)]
          focus-visible:ring-2 focus-visible:ring-ring
          focus-visible:ring-offset-1 focus-visible:ring-offset-background
          data-checked:bg-primary
          data-disabled:opacity-64
          data-unchecked:bg-input
          sm:[--thumb-size:--spacing(4)]
        `,
        className,
      )}
      data-slot="switch"
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          `
            pointer-events-none block aspect-square h-full origin-left
            rounded-(--thumb-size) bg-background shadow-sm/5
            will-change-transform
            [transition:translate_.15s,border-radius_.15s,scale_.1s_.1s,transform-origin_.15s]
            in-[[role=switch]:active,[data-slot=label]:active,[data-slot=field-label]:active]:rounded-[var(--thumb-size)/calc(var(--thumb-size)*1.1)]
            in-[[role=switch]:active,[data-slot=label]:active,[data-slot=field-label]:active]:not-data-disabled:scale-x-110
            data-checked:origin-[var(--thumb-size)_50%]
            data-checked:translate-x-[calc(var(--thumb-size)-0.25rem)]
          `,
        )}
        data-slot="switch-thumb"
      />
    </SwitchPrimitive.Root>
  )
}
