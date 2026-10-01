import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  Command,
  CommandEmpty,
  CommandInput,
} from '@tamery/ui/components/command'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'

export const PopoverCommand = ({
  children,
  searchPlaceholder,
}: {
  children: React.ReactNode
  searchPlaceholder: string
}) => (
  <Command loop>
    <CommandInput placeholder={searchPlaceholder} autoFocus />
    {children}
  </Command>
)

export const ListEmpty = ({
  children,
  icon,
}: {
  children: React.ReactNode
  icon: IconSvgElement
}) => (
  <CommandEmpty>
    <div className="text-muted-foreground flex flex-col items-center gap-2 py-4 text-xs">
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-5" />
      {children}
    </div>
  </CommandEmpty>
)

export const RowAction = ({
  destructive = false,
  icon,
  label,
  onClick,
}: {
  destructive?: boolean
  icon: IconSvgElement
  label: string
  onClick: () => void
}) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <Button
          variant={destructive ? 'ghost-destructive' : 'ghost-muted'}
          size="icon-xs"
          aria-label={label}
          tabIndex={-1}
          onPointerDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onClick={(event) => {
            event.stopPropagation()
            onClick()
          }}
        />
      }
    >
      <HugeiconsIcon icon={icon} strokeWidth={2} />
    </TooltipTrigger>
    <TooltipContent side="top">{label}</TooltipContent>
  </Tooltip>
)
