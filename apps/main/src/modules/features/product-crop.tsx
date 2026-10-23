import { cn } from '@tamery/ui/lib/utils'
import type { ReactNode } from 'react'

export const ProductCrop = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => (
  <div className="absolute inset-0 mask-b-from-70% pt-5 pl-6">
    <div
      className={cn(
        'bg-popover ring-foreground/4 h-full w-full min-w-120 overflow-hidden rounded-tl-xl shadow-md ring transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transition-none',
        className
      )}
    >
      {children}
    </div>
  </div>
)
