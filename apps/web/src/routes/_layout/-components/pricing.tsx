import { Button } from '@conar/ui/components/button'
import { Card } from '@conar/ui/components/card'
import { Tabs, TabsList, TabsTrigger } from '@conar/ui/components/tabs'
import { cn } from '@conar/ui/lib/utils'
import NumberFlow, { NumberFlowGroup } from '@number-flow/react'
import { RiCheckLine, RiCircleLine, RiMoneyDollarCircleLine } from '@remixicon/react'
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
      name: 'Hobby',
      price: {
        monthly: 0,
        yearly: 0,
      },
      description: 'Perfect for discover the app and explore the core features',
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
      description: 'For developers who want to use more features',
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
      <div className={cn(`
        mb-12 px-4 text-center
        sm:mb-16
      `)}
      >
        <h2
          id="pricing-heading"
          className={cn(`
            mb-3 text-center text-sm font-medium tracking-wide
            text-muted-foreground uppercase
          `)}
        >
          Pricing
        </h2>
        <p className={cn(`
          mx-auto max-w-3xl text-center text-2xl leading-tight font-bold
          text-balance
          sm:text-3xl
        `)}
        >
          Choose the plan that fits your needs
        </p>
      </div>
      <div className={cn(`
        mb-4 flex flex-col items-center gap-4
        sm:mb-6
      `)}
      >
        <Tabs
          value={isYearly ? 'yearly' : 'monthly'}
          onValueChange={value => setIsYearly(value === 'yearly')}
          className="w-fit"
        >
          <TabsList className="h-10">
            <TabsTrigger value="monthly" className="p-4">
              Monthly
            </TabsTrigger>
            <TabsTrigger value="yearly" className="p-4">
              Yearly
            </TabsTrigger>
          </TabsList>
        </Tabs>
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
            <div className="flex-1 p-4">
              <div className={cn(`mb-4 flex items-center justify-between`)}>
                <div className="rounded-xl bg-muted p-3 text-muted-foreground">
                  {tier.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {tier.name}
                </h3>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  {tier.price.monthly > 0
                    ? (
                        <NumberFlowGroup>
                          <NumberFlow
                            value={isYearly ? tier.price.yearly : tier.price.monthly}
                            className={cn(`
                              text-4xl font-bold text-foreground
                              [&::part(right)]:text-sm
                              [&::part(right)]:font-normal
                              [&::part(right)]:text-muted-foreground
                            `)}
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
                <p className={cn(`
                  mt-2 text-sm text-muted-foreground
                  sm:text-base
                `)}
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
                          mt-1 shrink-0 rounded-full p-0.5 text-muted-foreground
                          transition-colors duration-200
                        `,
                      )}
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
              mt-auto mb-5 p-6 pt-0
              sm:p-8
            `}
            >
              <Button
                className="relative w-full"
                variant="outline"
                size="lg"
                onClick={tier.onClick}
              >
                Get Started Free
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
