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
  badge?: string
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
          <div className="absolute inset-0 bg-gradient-to-r from-gray-500/30 to-gray-500/30 blur-2xl rounded-full" />
          <RiCircleLine className="w-7 h-7 relative z-10 text-gray-500 dark:text-gray-400 animate-[float_3s_ease-in-out_infinite]" />
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
        monthly: 0,
        yearly: 0,
      },
      description: 'All features free during beta',
      // description: 'For developers who want more',
      highlight: true,
      badge: 'Most Popular',
      icon: (
        <div className="relative">
          <RiMoneyDollarCircleLine className="size-7 relative z-10" />
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
        'py-8 sm:py-12 lg:py-16',
        'overflow-hidden',
        className,
      )}
    >
      <div className="mb-12 sm:mb-16 text-center px-4">
        <h2 id="pricing-heading" className="text-center mb-3 text-muted-foreground text-sm uppercase tracking-wide font-medium">
          Pricing
        </h2>
        <p className="text-center text-balance text-3xl sm:text-4xl md:text-5xl font-bold max-w-3xl mx-auto leading-tight">
          Choose the plan that fits your needs
        </p>
      </div>
      <div className="flex flex-col items-center gap-6 mb-6 sm:mb-10">
        <div className="inline-flex items-center p-1.5 bg-card border rounded-full shadow-sm">
          {['Monthly', 'Yearly'].map(period => (
            <button
              type="button"
              key={period}
              onClick={() => setIsYearly(period === 'Yearly')}
              className={cn(
                'px-6 sm:px-8 py-2.5 text-sm font-medium rounded-full transition-all duration-300',
                (period === 'Yearly') === isYearly
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {period}
            </button>
          ))}
        </div>
        <div className="h-6 flex items-center">
          {isYearly && tiers[1]!.price.yearly > 0 && tiers[1]!.price.monthly > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
              <RiStarLine className="size-4" />
              Save
              {' '}
              {Math.round((1 - (tiers[1]!.price.yearly / (tiers[1]!.price.monthly * 12))) * 100)}
              % with yearly billing
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto px-4">
        {tiers.map(tier => (
          <Card
            key={tier.name}
            className={cn(
              'relative transition-all duration-300 hover:shadow-lg flex flex-col',
              tier.highlight && 'ring-2 ring-primary/20 shadow-lg',
            )}
          >
            {tier.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                  {tier.badge}
                </div>
              </div>
            )}
            <div className="p-6 sm:p-8 flex-1">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div
                  className={cn(
                    'p-3 rounded-xl',
                    tier.highlight
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {tier.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-foreground">
                  {tier.name}
                </h3>
              </div>

              <div className="mb-6 sm:mb-8">
                <div className="flex items-baseline gap-2">
                  <NumberFlowGroup>
                    <NumberFlow
                      value={isYearly ? tier.price.yearly : tier.price.monthly}
                      className="text-4xl sm:text-5xl font-bold text-foreground [&::part(right)]:text-muted-foreground [&::part(right)]:text-sm [&::part(right)]:font-normal"
                      format={{
                        style: 'currency',
                        currency: 'USD',
                        currencyDisplay: 'narrowSymbol',
                      }}
                      suffix={tier.price.monthly === 0 ? '/forever' : isYearly ? '/year' : '/month'}
                    />
                  </NumberFlowGroup>
                </div>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                  {tier.description}
                </p>
              </div>

              <div className="space-y-4 sm:space-y-5">
                {tier.features.map(feature => (
                  <div key={feature.name} className="flex gap-3 sm:gap-4">
                    <div
                      className={cn(
                        'mt-1 p-0.5 rounded-full transition-colors duration-200 flex-shrink-0',
                        feature.included
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted-foreground/50',
                      )}
                    >
                      <RiCheckLine className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm sm:text-base font-medium text-foreground">
                        {feature.name}
                      </div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 sm:p-8 pt-0 mt-auto mb-5">
              <Button
                className="w-full relative"
                variant={tier.highlight ? 'default' : 'outline'}
                size="lg"
                disabled={tier.highlight}
                onClick={tier.onClick}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {tier.highlight
                    ? (
                        <>
                          Get Pro Plan
                          <RiArrowRightLine className="w-4 h-4" />
                        </>
                      )
                    : (
                        <>
                          Get Started Free
                          <RiArrowRightLine className="w-4 h-4" />
                        </>
                      )}
                </span>
              </Button>
              {tier.price.monthly === 0 && (
                <p className="absolute bottom-5 left-0 right-0 text-xs text-muted-foreground text-center mt-3">
                  No credit card required
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
