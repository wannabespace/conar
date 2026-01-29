import type { ComponentProps, ReactNode } from 'react'
import { Button } from '@conar/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowLeftDownLine, RiArrowRightUpLine } from '@remixicon/react'

export function ForeignButton(props: ComponentProps<'button'>) {
  return (
    <Button
      variant="outline"
      size="icon-xs"
      {...props}
    >
      <RiArrowRightUpLine className="size-3 text-muted-foreground" />
    </Button>
  )
}

export function ReferenceButton({ children, className, ...props }: ComponentProps<'button'>) {
  return (
    <Button
      variant="outline"
      size="xs"
      className={cn('px-1.5!', className)}
      {...props}
    >
      <RiArrowLeftDownLine className="size-3 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">
        {children}
      </span>
    </Button>
  )
}

interface RelationshipPopoverProps extends ComponentProps<typeof PopoverContent> {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: ReactNode
  tooltip: ReactNode
  children: ReactNode
}

export function RelationshipPopover({
  open,
  onOpenChange,
  trigger,
  tooltip,
  children,
  className,
  ...props
}: RelationshipPopoverProps) {
  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              {trigger}
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent className="text-sm">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent
        className={cn('h-[45vh] w-[80vw] overflow-hidden p-0', className)}
        onDoubleClick={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        side="bottom"
        align="center"
        collisionPadding={16}
        {...props}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}
