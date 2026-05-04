import type { ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'

function Skeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={`
            flex w-full flex-col gap-3 rounded-xl border border-border/40
            bg-muted/10 p-4
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-5 animate-pulse rounded-md bg-muted/20" />
              <div className="h-5 w-48 animate-pulse rounded-md bg-muted/20" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-muted/20" />
            </div>
            <div className="h-5 w-24 animate-pulse rounded-full bg-muted/20" />
          </div>
          <div className="pl-8">
            <div className="flex gap-2">
              <div className="h-5 w-16 animate-pulse rounded-md bg-muted/20" />
              <div className="h-5 w-24 animate-pulse rounded-md bg-muted/20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function DefinitionsGrid({ loading, children }: {
  loading: boolean
  children: ReactNode
}) {
  return (
    <div className="mt-2 grid grid-cols-1 gap-4">
      {loading
        ? <Skeleton />
        : (
            <AnimatePresence initial={false} mode="popLayout">
              {children}
            </AnimatePresence>
          )}
    </div>
  )
}
