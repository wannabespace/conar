import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { CommandEmpty } from '@tamery/ui/components/command'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'

export const SEARCH_FROM = 8

export const ListEmpty = ({
  children,
  icon,
}: {
  children: React.ReactNode
  icon: IconSvgElement
}) => (
  <CommandEmpty className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-xs">
    <HugeiconsIcon icon={icon} strokeWidth={2} className="size-5" />
    {children}
  </CommandEmpty>
)

export const RowAction = ({
  className,
  destructive = false,
  icon,
  label,
  onClick,
}: {
  className?: string
  destructive?: boolean
  icon: IconSvgElement
  label: string
  onClick: () => void
}) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={label}
          tabIndex={-1}
          className={cn(
            'text-muted-foreground/60',
            destructive
              ? 'hover:bg-destructive/10 hover:text-destructive'
              : 'hover:text-foreground',
            className
          )}
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
