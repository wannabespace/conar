import type { ReactNode } from 'react'

export const SectionHeading = ({
  children,
  id,
  title,
}: {
  children: ReactNode
  id: string
  title: string
}) => (
  <h2
    id={id}
    className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
  >
    {title} <span className="text-muted-foreground">{children}</span>
  </h2>
)
