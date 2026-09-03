import { ArrowRight01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { Card } from '@tamery/ui/components/card'
import {
  NumberFlow,
  NumberFlowGroup,
} from '@tamery/ui/components/custom/number-flow'
import { cn } from '@tamery/ui/lib/utils'
import type { LinkProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { authClient } from '~/lib/auth'
import type { PricingPlan } from '~/utils/pricing'
import { HOBBY_PLAN, PRO_PLAN } from '~/utils/pricing'

interface PricingSectionProps {
  className?: string
}

export const Pricing = ({ className }: PricingSectionProps) => {
  const { data: session } = authClient.useSession()
  const [isYearly, setIsYearly] = useState(false)

  const plans: (PricingPlan & { link: LinkProps })[] = [
    { ...HOBBY_PLAN, link: { to: '/download' } },
    {
      ...PRO_PLAN,
      link: {
        to: session ? '/account' : '/sign-in',
        search: { period: isYearly ? 'yearly' : 'monthly' },
      },
    },
  ]

  return (
    <section
      aria-labelledby="pricing-heading"
      className={cn(
        `bg-background text-foreground relative overflow-hidden py-8 sm:py-12 lg:py-16`,
        className
      )}
    >
      <div className="mb-6 px-4 text-center sm:mb-10">
        <h2
          id="pricing-heading"
          className="text-muted-foreground mb-3 text-center text-sm font-medium tracking-wide uppercase"
        >
          Pricing
        </h2>
        <p className="mx-auto max-w-3xl text-center text-2xl/tight font-bold text-balance sm:text-3xl">
          Choose the plan that fits your needs
        </p>
      </div>
      <div className="mb-3 flex flex-col items-center gap-6 sm:mb-6">
        <div className="bg-card inline-flex items-center rounded-full border p-1.5 shadow-sm">
          {['Monthly', 'Yearly'].map((period) => (
            <button
              type="button"
              key={period}
              onClick={() => setIsYearly(period === 'Yearly')}
              className={cn(
                `rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-100 sm:px-8`,
                (period === 'Yearly') === isYearly
                  ? 'bg-primary text-primary-foreground'
                  : `text-muted-foreground hover:text-foreground`
              )}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-4 sm:gap-6 lg:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.name} className="relative flex flex-col p-0">
            <div className="flex-1 p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between sm:mb-8">
                <div
                  className={cn(
                    'bg-muted text-muted-foreground rounded-xl p-3'
                  )}
                >
                  <HugeiconsIcon
                    icon={plan.icon}
                    strokeWidth={2}
                    className="text-muted-foreground size-7"
                  />
                </div>
                <h3 className="text-foreground text-lg font-semibold">
                  {plan.name}
                </h3>
              </div>
              <div className="mb-6 sm:mb-8">
                <div className="flex items-baseline gap-2">
                  {plan.price.monthly > 0 ? (
                    <NumberFlowGroup>
                      <NumberFlow
                        value={
                          isYearly ? plan.price.yearly : plan.price.monthly
                        }
                        className="text-foreground [&::part(right)]:text-muted-foreground text-4xl font-bold [&::part(right)]:text-sm [&::part(right)]:font-normal"
                        format={{
                          style: 'currency',
                          currency: 'USD',
                          currencyDisplay: 'narrowSymbol',
                        }}
                        suffix={isYearly ? '/year' : '/month'}
                      />
                    </NumberFlowGroup>
                  ) : (
                    <span className="text-foreground text-4xl font-bold">
                      Free
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                  {plan.description}
                </p>
              </div>
              <div className="space-y-4 sm:space-y-5">
                {plan.features.map((feature) => (
                  <div key={feature.name} className="flex gap-3 sm:gap-4">
                    <div className="mt-1 shrink-0 rounded-full p-0.5">
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        strokeWidth={2}
                        className="size-4"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-foreground text-sm font-medium sm:text-base">
                        {feature.name}
                      </div>
                      <div className="text-muted-foreground text-sm/relaxed">
                        {feature.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-auto p-6 pt-0 sm:p-8">
              <Button
                className="relative w-full"
                variant="outline"
                size="lg"
                render={<Link {...plan.link} />}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {plan.price.monthly > 0 ? `Get ${plan.name}` : 'Download'}
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="size-4"
                  />
                </span>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
