import type { ReactNode } from 'react'

export const FooterColumn = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <div className="flex flex-col gap-3">
    <h2 className="text-foreground text-sm font-medium">{title}</h2>
    {children}
  </div>
)
