import { cn } from '@conar/ui/lib/utils'
import { createContext, use, useMemo } from 'react'

const StepperContext = createContext<{
  active: string
}>(null!)

export function Stepper<T extends string>({
  active,
  children,
}: {
  active: T
  onChange: (active: T) => void
  children: React.ReactNode
}) {
  return (
    <StepperContext value={useMemo(() => ({ active }), [active])}>
      {children}
    </StepperContext>
  )
}

export function StepperList({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex mb-6 -mx-4 justify-between relative h-10 before:absolute before:-z-10 before:inset-0 before:top-1/2 before:-translate-y-1/2 before:h-0.5 before:w-full before:bg-gradient-to-r before:from-transparent before:via-slate-300 before:to-transparent">
      {children}
    </div>
  )
}

export function StepperTrigger({ children, value, number }: { children: React.ReactNode, value: string, number: number }) {
  const { active } = use(StepperContext)

  return (
    <div className="flex items-center gap-4 bg-background px-4">
      <div
        className={cn(
          'flex size-10 items-center justify-center rounded-full border border-border',
          active === value ? 'bg-primary text-primary-foreground border-transparent' : 'bg-background text-foreground',
        )}
      >
        {number}
      </div>
      {children}
    </div>
  )
}

export function StepperContent({
  value,
  children,
}: {
  value: string
  children: React.ReactNode
}) {
  const { active } = use(StepperContext)

  if (active !== value)
    return null

  return children
}
