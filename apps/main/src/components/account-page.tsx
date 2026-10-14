import { smallItemInsetClassName } from '@tamery/ui/components/item'
import { cn } from '@tamery/ui/lib/utils'
import type { ReactNode } from 'react'

export const AccountPage = ({
  action,
  children,
  title,
}: {
  action?: ReactNode
  children: ReactNode
  title: string
}) => (
  // Sync the table's outer cell padding with `smallItemInsetClassName`.
  <div className="flex flex-col gap-8 [&_:is(th,td):first-child]:pl-3.5 [&_:is(th,td):last-child]:pr-3.5">
    <header
      className={cn(
        smallItemInsetClassName,
        'flex min-h-8 flex-wrap items-center justify-between gap-3'
      )}
    >
      <h1 className="text-xl font-semibold">{title}</h1>
      {action}
    </header>
    {children}
  </div>
)
