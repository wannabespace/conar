import { cn } from '@tamery/ui/lib/utils'

const Kbd = ({ className, ...props }: React.ComponentProps<'kbd'>) => (
  <kbd
    data-slot="kbd"
    className={cn(
      `bg-foreground/5 text-muted-foreground/80 in-data-[slot=input-group]:bg-input in-data-[slot=tooltip-content]:bg-card/15 in-data-[slot=tooltip-content]:text-card in-data-[slot=tooltip-content]:text-2xs in-data-[slot=dropdown-menu-shortcut]:text-2xs in-data-[slot=context-menu-shortcut]:text-2xs pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-0.5 rounded-md px-1 font-sans text-xs font-medium tracking-normal select-none in-data-[slot=context-menu-shortcut]:h-4 in-data-[slot=context-menu-shortcut]:min-w-4 in-data-[slot=dropdown-menu-shortcut]:h-4 in-data-[slot=dropdown-menu-shortcut]:min-w-4 in-data-[slot=tooltip-content]:h-4 in-data-[slot=tooltip-content]:min-w-4 in-data-[slot=context-menu-shortcut]:[&_svg]:size-2.5 in-data-[slot=dropdown-menu-shortcut]:[&_svg]:size-2.5 in-data-[slot=tooltip-content]:[&_svg]:size-2.5 [&_svg:not([class*='size-'])]:size-3`,
      className
    )}
    {...props}
  />
)

const KbdGroup = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <kbd
    data-slot="kbd-group"
    className={cn('inline-flex items-center gap-1', className)}
    {...props}
  />
)

export { Kbd, KbdGroup }
