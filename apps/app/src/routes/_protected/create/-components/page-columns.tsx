import type { ReactNode } from 'react'

export const PageColumns = ({
  aside,
  children,
}: {
  aside?: ReactNode
  children: ReactNode
}) => (
  <div className="mx-auto grid w-full max-w-xl gap-y-12 px-6 lg:max-w-5xl lg:grid-cols-5 lg:gap-x-16">
    {aside}
    <div className="flex min-w-0 flex-col gap-5 lg:col-span-3 lg:col-start-3">
      {children}
    </div>
  </div>
)
