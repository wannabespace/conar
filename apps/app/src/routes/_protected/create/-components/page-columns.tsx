import { cn } from '@tamery/ui/lib/utils'
import type { ReactNode } from 'react'

/** The page's two columns; the footer and test alert pass no `aside` so they line up under the form. */
export const PageColumns = ({
  aside,
  children,
  className,
}: {
  aside?: ReactNode
  children: ReactNode
  className?: string
}) => (
  <div
    className={cn(
      'mx-auto grid w-full max-w-xl gap-y-12 px-6 lg:max-w-5xl lg:grid-cols-5 lg:gap-x-16',
      className
    )}
  >
    {aside}
    <div className="flex min-w-0 flex-col gap-5 lg:col-span-3 lg:col-start-3">
      {children}
    </div>
  </div>
)
