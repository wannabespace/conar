import type { ReactNode } from 'react'

import { TopBar } from '~/components/top-bar'

export const SharesFrame = ({
  children,
  description,
}: {
  children: ReactNode
  description: ReactNode
}) => (
  <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 pt-4 pb-10 sm:px-6">
    <TopBar />
    <header className="flex flex-col gap-2 px-3.5">
      <h1 className="text-3xl font-semibold tracking-tight">
        Your shared tables
      </h1>
      <div className="text-muted-foreground text-sm">{description}</div>
    </header>
    {children}
  </div>
)
