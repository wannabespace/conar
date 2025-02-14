import { cn } from '@connnect/ui/lib/utils'
import { createContext, use } from 'react'

const StepperContext = createContext<{
  active: string
}>(null!)

export function Stepper<T extends string>({
  active,
  children,
  steps,
}: {
  active: T
  onChange: (active: T) => void
  children: React.ReactNode
  steps: { id: T, label: string }[]
}) {
  return (
    <StepperContext value={{ active }}>
      <div className="flex -mx-4 justify-between relative h-10 before:absolute before:-z-10 before:inset-0 before:top-1/2 before:-translate-y-1/2 before:h-0.5 before:w-full before:bg-gradient-to-r before:from-transparent before:via-slate-300 before:to-transparent">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="flex items-center gap-4 bg-body px-4"
          >
            <div
              className={cn(
                'flex size-10 items-center justify-center rounded-full border border-border',
                active === step.id ? 'bg-primary text-primary-foreground border-transparent' : 'bg-background text-foreground',
              )}
            >
              {index + 1}
            </div>
            {step.label}
          </div>
        ))}
      </div>
      {children}
    </StepperContext>
  )
}

export function StepperStep({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  const { active } = use(StepperContext)

  if (active !== id)
    return null

  return children
}
