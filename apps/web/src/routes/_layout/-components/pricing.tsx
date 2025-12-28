import { Button } from '@conar/ui/components/button'
import { Card } from '@conar/ui/components/card'
import { cn } from '@conar/ui/lib/utils'
import NumberFlow, { NumberFlowGroup } from '@number-flow/react'
import { RiArrowRightLine, RiCheckLine, RiCircleLine, RiMoneyDollarCircleLine, RiStarLine } from '@remixicon/react'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

interface Feature {
  name: string
  description: string
  included: boolean
}

interface PricingTier {
  name: string
  price: {
    monthly: number
    yearly: number
  }
  description: string
  features: Feature[]
  highlight?: boolean
  icon: React.ReactNode
  onClick?: () => void
}

interface PricingSectionProps {
  className?: string
}

export function Pricing({ className }: PricingSectionProps) {
  const router = useRouter()
  const [isYearly, setIsYearly] = useState(false)

  const tiers: PricingTier[] = [
    {
      name: 'Free',
      price: {
        monthly: 0,
        yearly: 0,
      },
      description: 'Perfect for individuals and small projects',
      icon: (
        <div className="relative">
          <div className={`
            absolute inset-0 rounded-full bg-linear-to-r from-gray-500/30
            to-gray-500/30 blur-2xl
          `}
          />
          <RiCircleLine className={`
            relative z-10 h-7 w-7 animate-[float_3s_ease-in-out_infinite]
            text-gray-500
            dark:text-gray-400
          `}
          />
        </div>
      ),
      onClick: () => {
        router.navigate({ to: '/download' })
      },
      features: [
        {
          name: 'AI-Powered Data Filtering',
          description: 'Ask AI to create filters for you instead of entering them manually',
          included: true,
        },
        {
          name: 'Natural Language Queries',
          description: 'Ask questions in natural language and get instant SQL queries',
          included: true,
        },
        {
          name: 'Basic Data Management',
          description: 'View and browse data with basic filtering capabilities',
          included: true,
        },
        {
          name: 'Cloud Synchronization',
          description: 'Sync your connections with the cloud for backup',
          included: true,
        },
      ],
    },
    {
      name: 'Pro',
      price: {
        monthly: 10,
        yearly: 100,
      },
      description: 'For developers who want more',
      icon: (
        <div className="relative">
          <RiMoneyDollarCircleLine className="relative z-10 size-7" />
        </div>
      ),
      features: [
        {
          name: 'Everything in Free',
          description: 'All features from the free plan included',
          included: true,
        },
        // {
        //   name: 'Priority Support',
        //   description: '24/7 priority email and chat support',
        //   included: true,
        // },
      ],
    },
  ]

  return (
    <section
      aria-labelledby="pricing-heading"
      className={cn(
        'relative bg-background text-foreground',
        `
          py-8
          sm:py-12
          lg:py-16
        `,
        'overflow-hidden',
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
        mb-6 flex flex-col items-center gap-6
        sm:mb-10
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
                  duration-300
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
        <div className="flex h-6 items-center">
          {isYearly && tiers[1]!.price.yearly > 0 && tiers[1]!.price.monthly > 0 && (
            <div className={`
              flex items-center gap-2 text-sm font-medium text-green-600
              dark:text-green-400
            `}
            >
              <RiStarLine className="size-4" />
              Save
              {' '}
              {Math.round((1 - (tiers[1]!.price.yearly / (tiers[1]!.price.monthly * 12))) * 100)}
              % with yearly billing
            </div>
          )}
        </div>
      </div>
      <div className={cn(`
        mx-auto grid max-w-5xl grid-cols-1 gap-4 px-4
        sm:gap-6
        lg:grid-cols-2
      `)}
      >
        {tiers.map(tier => (
          <Card
            key={tier.name}
            className={cn(`
              relative flex flex-col transition-all duration-300
              hover:shadow-lg
            `)}
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
                  className="rounded-xl bg-muted p-3 text-muted-foreground"
                >
                  {tier.icon}
                </div>
                <h3 className={`
                  text-xl font-semibold text-foreground
                  sm:text-2xl
                `}
                >
                  {tier.name}
                </h3>
              </div>

              <div className={`
                mb-6
                sm:mb-8
              `}
              >
                <div className="flex items-baseline gap-2">
                  <NumberFlowGroup>
                    <NumberFlow
                      value={isYearly ? tier.price.yearly : tier.price.monthly}
                      className={`
                        text-4xl font-bold text-foreground
                        sm:text-5xl
                        [&::part(right)]:text-sm [&::part(right)]:font-normal
                        [&::part(right)]:text-muted-foreground
                      `}
                      format={{
                        style: 'currency',
                        currency: 'USD',
                        currencyDisplay: 'narrowSymbol',
                      }}
                      suffix={tier.price.monthly === 0 ? '/forever' : isYearly ? '/year' : '/month'}
                    />
                  </NumberFlowGroup>
                </div>
                <p className={`
                  mt-2 text-sm text-muted-foreground
                  sm:text-base
                `}
                >
                  {tier.description}
                </p>
              </div>

              <div className={`
                space-y-4
                sm:space-y-5
              `}
              >
                {tier.features.map(feature => (
                  <div
                    key={feature.name}
                    className={`
                      flex gap-3
                      sm:gap-4
                    `}
                  >
                    <div
                      className={cn(
                        `
                          mt-1 shrink-0 rounded-full p-0.5 transition-colors
                          duration-200
                        `,
                        feature.included
                          ? `
                            text-green-600
                            dark:text-green-400
                          `
                          : 'text-muted-foreground/50',
                      )}
                    >
                      <RiCheckLine className="h-4 w-4" />
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
              mt-auto mb-5 p-6 pt-0
              sm:p-8
            `}
            >
              <Button
                className="relative w-full"
                variant={tier.highlight ? 'default' : 'outline'}
                size="lg"
                disabled={tier.highlight}
                onClick={tier.onClick}
              >
                <span className={`
                  relative z-10 flex items-center justify-center gap-2
                `}
                >
                  {tier.highlight
                    ? (
                        <>
                          Get Pro Plan
                          <RiArrowRightLine className="h-4 w-4" />
                        </>
                      )
                    : (
                        <>
                          Get Started Free
                          <RiArrowRightLine className="h-4 w-4" />
                        </>
                      )}
                </span>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
