import { Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { cn } from '@tamery/ui/lib/utils'
import type { ReactNode } from 'react'

export const PlanCard = ({
  action,
  description,
  features,
  highlighted,
  includes,
  name,
  price,
}: {
  action: ReactNode
  description: string
  features: string[]
  highlighted?: boolean
  includes?: string
  name: string
  price: ReactNode
}) => (
  <article
    className={cn(
      'ring-foreground/4 flex flex-col rounded-2xl p-6 ring sm:p-8',
      highlighted ? 'bg-popover shadow-md' : 'bg-background shadow-xs'
    )}
  >
    <h3 className="font-medium">{name}</h3>
    <p className="text-muted-foreground mt-1 text-sm">{description}.</p>
    <div className="mt-6 flex h-10 items-baseline gap-1">{price}</div>
    <div className="mt-6 grid">{action}</div>
    <div className="mt-8 flex flex-col gap-3 border-t pt-6 text-sm">
      {includes && (
        <p className="text-muted-foreground">Everything in {includes}, plus</p>
      )}
      <ul className="flex flex-col gap-3">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2.5">
            <HugeiconsIcon
              icon={Tick02Icon}
              strokeWidth={2}
              className="text-primary mt-0.5 size-4 shrink-0"
            />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  </article>
)
