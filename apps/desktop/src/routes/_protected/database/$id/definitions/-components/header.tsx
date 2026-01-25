import type { ReactNode } from 'react'

export function DefinitionsHeader({ title, suffix, children }: {
  title: string
  suffix?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-2xl font-bold">
        {title}
        {suffix}
      </h2>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  )
}
