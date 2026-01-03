import type { LinkProps } from '@tanstack/react-router'
import type { PricingPlan } from '~/utils/pricing'
import { Button } from '@conar/ui/components/button'
import { Card } from '@conar/ui/components/card'
import { cn } from '@conar/ui/lib/utils'
import NumberFlow, { NumberFlowGroup } from '@number-flow/react'
import { RiArrowRightLine, RiCheckLine } from '@remixicon/react'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '~/lib/auth'
import { HOBBY_PLAN, PRO_PLAN } from '~/utils/pricing'

interface PricingSectionProps {
  className?: string
}

export function Pricing({ className }: PricingSectionProps) {
  const { data: session } = authClient.useSession()
  const [isYearly, setIsYearly] = useState(false)

  const plans: (PricingPlan & { link: LinkProps })[] = [
    { ...HOBBY_PLAN, link: { to: '/download' } },
    { ...PRO_PLAN, link: { to: session ? '/account' : '/sign-in' } },
  ]

  return (
    <section
      aria-labelledby="pricing-heading"
      className={cn(
        `
          relative overflow-hidden bg-background py-8 text-foreground
          sm:py-12
          lg:py-16
        `,
        className,
      )}
    >
      <div className={`
        mb-12 px-4 text-center
        sm:mb-16
      `}
      >
        <h2
          id="pricing-heading"
          className={`
            mb-3 text-center text-sm font-medium tracking-wide
            text-muted-foreground uppercase
          `}
        >
          Pricing
        </h2>
        <p className={`
          mx-auto max-w-3xl text-center text-2xl leading-tight font-bold
          text-balance
          sm:text-3xl
        `}
        >
          Choose the plan that fits your needs
        </p>
      </div>
      <div className={`
        mb-3 flex flex-col items-center gap-6
        sm:mb-6
      `}
      >
        <div className={`
          inline-flex items-center rounded-full border bg-card p-1.5 shadow-sm
        `}
        >
          {['Monthly', 'Yearly'].map(period => (
            <button
              type="button"
              key={period}
              onClick={() => setIsYearly(period === 'Yearly')}
              className={cn(
                `
                  rounded-full px-6 py-2.5 text-sm font-medium transition-all
                  duration-100
                  sm:px-8
                `,
                (period === 'Yearly') === isYearly
                  ? 'bg-primary text-primary-foreground'
                  : `
                    text-muted-foreground
                    hover:text-foreground
                  `,
              )}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      <div className={`
        mx-auto grid max-w-5xl grid-cols-1 gap-4 px-4
        sm:gap-6
        lg:grid-cols-2
      `}
      >
        {plans.map(plan => (
          <Card
            key={plan.name}
            className="relative flex flex-col p-0"
          >
            <div className={`
              flex-1 p-6
              sm:p-8
            `}
            >
              <div className={`
                mb-6 flex items-center justify-between
                sm:mb-8
              `}
              >
                <div
                  className={cn(
                    'rounded-xl bg-muted p-3 text-muted-foreground',
                  )}
                >
                  <plan.icon
                    className="size-7 text-muted-foreground"
                  />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {plan.name}
                </h3>
              </div>
              <div className={`
                mb-6
                sm:mb-8
              `}
              >
                <div className="flex items-baseline gap-2">
                  {plan.price.monthly > 0
                    ? (
                        <NumberFlowGroup>
                          <NumberFlow
                            value={isYearly ? plan.price.yearly : plan.price.monthly}
                            className={`
                              text-4xl font-bold text-foreground
                              [&::part(right)]:text-sm
                              [&::part(right)]:font-normal
                              [&::part(right)]:text-muted-foreground
                            `}
                            format={{
                              style: 'currency',
                              currency: 'USD',
                              currencyDisplay: 'narrowSymbol',
                            }}
                            suffix={isYearly ? '/year' : '/month'}
                          />
                        </NumberFlowGroup>
                      )
                    : (
                        <span className="text-4xl font-bold text-foreground">
                          Free
                        </span>
                      )}
                </div>
                <p className={`
                  mt-2 text-sm text-muted-foreground
                  sm:text-base
                `}
                >
                  {plan.description}
                </p>
              </div>
              <div className={`
                space-y-4
                sm:space-y-5
              `}
              >
                {plan.features.map(feature => (
                  <div
                    key={feature.name}
                    className={`
                      flex gap-3
                      sm:gap-4
                    `}
                  >
                    <div
                      className="mt-1 shrink-0 rounded-full p-0.5"
                    >
                      <RiCheckLine className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`
                        text-sm font-medium text-foreground
                        sm:text-base
                      `}
                      >
                        {feature.name}
                      </div>
                      <div className={`
                        text-sm leading-relaxed text-muted-foreground
                      `}
                      >
                        {feature.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={`
              mt-auto p-6 pt-0
              sm:p-8
            `}
            >
              <Button
                className="relative w-full"
                variant="outline"
                size="lg"
                asChild
              >
                <Link {...plan.link}>
                  <span className={`
                    relative z-10 flex items-center justify-center gap-2
                  `}
                  >
                    {plan.price.monthly > 0 ? `Get ${plan.name}` : 'Download'}
                    <RiArrowRightLine className="size-4" />
                  </span>
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
