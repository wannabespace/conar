import { cn } from '@tamery/ui/lib/utils'
import { createContext, use } from 'react'

const StepperContext = createContext<{
  active: string
} | null>(null)

const useStepperContext = () => {
  const context = use(StepperContext)
  if (!context) {
    throw new Error('Stepper components must be used within a Stepper')
  }
  return context
}

export const Stepper = <T extends string>({
  active,
  children,
}: {
  active: T
  onChange: (active: T) => void
  children: React.ReactNode
}) => <StepperContext value={{ active }}>{children}</StepperContext>

export const StepperList = ({ children }: { children: React.ReactNode }) => (
  <div className="relative -mx-4 mb-6 flex h-10 justify-between before:absolute before:inset-0 before:top-1/2 before:-z-10 before:h-0.5 before:w-full before:-translate-y-1/2 before:bg-linear-to-r before:from-transparent before:via-slate-300 before:to-transparent">
    {children}
  </div>
)

export const StepperTrigger = ({
  children,
  value,
  number,
}: {
  children: React.ReactNode
  value: string
  number: number
}) => {
  const { active } = useStepperContext()

  return (
    <div className="bg-background flex items-center gap-4 px-4">
      <div
        className={cn(
          `border-border flex size-10 items-center justify-center rounded-full border`,
          active === value
            ? `bg-primary text-primary-foreground border-transparent`
            : `bg-background text-foreground`
        )}
      >
        {number}
      </div>
      {children}
    </div>
  )
}

export const StepperContent = ({
  value,
  children,
}: {
  value: string
  children: React.ReactNode
}) => {
  const { active } = useStepperContext()

  if (active !== value) {
    return null
  }

  return children
}
