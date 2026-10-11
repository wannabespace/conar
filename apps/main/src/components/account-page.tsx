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
  <div className="flex flex-col gap-8">
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
