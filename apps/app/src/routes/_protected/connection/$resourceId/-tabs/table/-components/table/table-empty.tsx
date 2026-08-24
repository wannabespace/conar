import { RiMoreLine } from '@remixicon/react'
import { cn } from '@tamery/ui/lib/utils'

export const TableEmpty = ({
  className,
  title,
  description,
}: {
  className?: string
  title: string
  description: string
}) => (
  <div
    className={cn(
      `pointer-events-none sticky left-0 flex items-center justify-center`,
      className
    )}
  >
    <div className="flex h-32 w-full flex-col items-center justify-center">
      <div className="bg-muted/60 texture-dither mb-4 flex items-center justify-center rounded-full p-3">
        <RiMoreLine className="text-muted-foreground size-6" />
      </div>
      <span className="text-muted-foreground font-medium">{title}</span>
      <span className="text-muted-foreground/70 text-xs">{description}</span>
    </div>
  </div>
)
