import type { ReactNode } from 'react'
import type { PricingPlan } from '~/utils/pricing'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@conar/ui/components/card'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Skeleton } from '@conar/ui/components/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiHeart3Fill, RiInformationLine, RiLoader4Fill, RiTimeLine, RiWalletLine } from '@remixicon/react'
import { useRouter } from '@tanstack/react-router'
import { format, formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { useBillingPortal, useSubscription, useUpgradeSubscription } from '~/hooks/use-subscription'
import { HOBBY_PLAN, PRO_PLAN } from '~/utils/pricing'
import { Route } from '..'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function Subscription() {
  const { period } = Route.useSearch()
  const { subscription, isPending } = useSubscription()
  const router = useRouter()
  const returnUrl = router.buildLocation({ to: '/account' }).url.href
  const { openBillingPortal, isOpening } = useBillingPortal({ returnUrl })
  const { upgrade, isUpgrading } = useUpgradeSubscription()
  const [isYearly, setIsYearly] = useState(period === 'yearly')

  if (subscription && subscription.period === 'yearly' && !isYearly) {
    setIsYearly(true)
  }

  const plans: (PricingPlan & {
    footer?: ReactNode
  })[] = [
    HOBBY_PLAN,
    {
      ...PRO_PLAN,
      footer: isPending
        ? (
            <div className="flex items-center gap-2">
              <Skeleton
                className="h-5 w-30"
              />
              <Skeleton
                className="h-5 w-30"
              />
            </div>
          )
        : subscription
          ? (
              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  disabled={isOpening}
                  onClick={() => openBillingPortal()}
                >
                  <LoadingContent loading={isOpening} loaderClassName="size-3.5">
                    <RiWalletLine className="size-3.5" />
                    Manage Subscription
                  </LoadingContent>
                </Button>
                <span className={`
                  flex items-center gap-1 text-xs text-muted-foreground
                `}
                >
                  <RiTimeLine className="size-3.5" />
                  {(subscription.cancelAtPeriodEnd || subscription.cancelAt)
                    ? subscription.cancelAt ? `Cancels at ${format(subscription.cancelAt, 'MMM d, yyyy')}` : 'Cancels at period end'
                    : subscription.status === 'trialing' && subscription.trialEnd
                      ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  Free trial ends in
                                  {' '}
                                  {formatDistanceToNow(subscription.trialEnd, { addSuffix: true })}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <span>
                                  Your trial will end on
                                  {' '}
                                  {format(subscription.trialEnd, 'MMM d, yyyy h:mm a')}
                                </span>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      : (subscription.periodEnd
                          ? `Next payment on ${format(subscription.periodEnd, 'MMM d, yyyy')}`
                          : 'No upcoming payment'
                        )}
                </span>
              </div>
            )
          : (
              <div className="flex items-center gap-4">
                <Button
                  size="xs"
                  disabled={isUpgrading}
                  onClick={() => upgrade(isYearly)}
                >
                  <LoadingContent loading={isUpgrading} loaderClassName="size-3.5">
                    Upgrade to Pro
                  </LoadingContent>
                </Button>
                <span className="text-xs text-muted-foreground">
                  7-day free trial included
                </span>
              </div>
            ),
    },
  ]

  return (
    <Card>
      <CardHeader className="flex-row justify-between space-y-0">
        <div className="flex flex-col">
          <CardTitle className="flex items-center gap-2">
            Subscription
            {isPending && (
              <RiLoader4Fill
                className={cn('size-4 animate-spin')}
              />
            )}
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            Manage your subscription
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="focus:outline-none">
                    <RiInformationLine className="size-4" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-background p-0">
                  <div className={`
                    space-y-4 bg-linear-to-b from-primary/5 to-card p-4 text-sm
                  `}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`
                        inline-flex size-6 items-center justify-center
                        rounded-full bg-primary/20 text-primary
                      `}
                      >
                        <RiHeart3Fill className="size-4" />
                      </span>
                      <span className="font-semibold text-primary">Conar is indie & user-supported</span>
                    </div>
                    <p className="text-balance text-foreground">
                      Our small team works every day to improve Conar without sponsors or VCs, and on our own terms.
                    </p>
                    <p className="text-balance text-muted-foreground">
                      Your subscription directly supports our work and future development.
                    </p>
                    <p className="font-medium text-balance text-foreground">Thank you for helping us stay independent.</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardDescription>
        </div>
        {!subscription && !isPending && (
          <div className="flex items-center">
            <div className={`
              inline-flex items-center rounded-full border bg-card p-1 shadow-sm
            `}
            >
              {['Monthly', 'Yearly'].map(period => (
                <button
                  type="button"
                  key={period}
                  onClick={() => setIsYearly(period === 'Yearly')}
                  className={cn(
                    `
                      rounded-full px-3 py-1 text-sm font-medium transition-all
                      duration-100
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
        )}
      </CardHeader>
      <CardContent>
        <div className={`
          grid-cols-2 gap-6
          lg:grid
        `}
        >
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`
                flex h-50 flex-col justify-between rounded-lg border p-4
              `}
            >
              <div className="flex flex-col gap-4">
                <span className={`
                  flex size-10 shrink-0 items-center justify-center rounded-md
                  bg-muted
                `}
                >
                  <plan.icon className="size-5 text-muted-foreground" />
                </span>
                <div>
                  <div className="flex items-center gap-2 text-lg">
                    <span className="font-medium">
                      {plan.name}
                      {' '}
                      {plan.price.monthly > 0 && (
                        <span className={`
                          text-sm font-normal text-muted-foreground
                        `}
                        >
                          {formatCurrency(isYearly ? plan.price.yearly : plan.price.monthly)}
                          {isYearly ? '/year' : '/month'}
                        </span>
                      )}
                    </span>
                    {!isPending && ((subscription?.plan === plan.name.toLowerCase() || (!subscription && plan.name === 'Hobby'))) && (
                      <Badge variant="secondary">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>
              </div>
              <div>{plan.footer}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
