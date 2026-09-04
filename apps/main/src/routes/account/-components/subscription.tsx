import {
  Alert02Icon,
  Clock01Icon,
  FavouriteIcon,
  InformationCircleIcon,
  Loading03Icon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { SUBSCRIPTION_PAST_DUE_MESSAGE } from '@tamery/shared/constants'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@tamery/ui/components/alert'
import { Badge } from '@tamery/ui/components/badge'
import { Button } from '@tamery/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tamery/ui/components/card'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { Skeleton } from '@tamery/ui/components/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { format, formatDistanceToNow } from 'date-fns'
import type { ReactNode } from 'react'
import { useState } from 'react'

import {
  useBillingPortal,
  useSubscription,
  useUpgradeSubscription,
} from '~/hooks/use-subscription'
import type { PricingPlan } from '~/utils/pricing'
import { HOBBY_PLAN, PRO_PLAN } from '~/utils/pricing'

const { useSearch } = getRouteApi('/account/')

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)

const renderSubscriptionStatus = ({
  subscription,
  hasUpcomingTrialEnd,
}: {
  subscription: NonNullable<ReturnType<typeof useSubscription>['subscription']>
  hasUpcomingTrialEnd: boolean
}) => {
  if (subscription.cancelAtPeriodEnd || subscription.cancelAt) {
    if (subscription.cancelAt) {
      return `Cancels at ${format(subscription.cancelAt, 'MMM d, yyyy')}`
    }
    return 'Cancels at period end'
  }

  if (
    subscription.status === 'trialing' &&
    hasUpcomingTrialEnd &&
    subscription.trialEnd
  ) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span />}>
          Free trial ends{' '}
          {formatDistanceToNow(subscription.trialEnd, {
            addSuffix: true,
          })}
        </TooltipTrigger>
        <TooltipContent>
          <span>
            Your trial will end on{' '}
            {format(subscription.trialEnd, 'MMM d, yyyy h:mm a')}
          </span>
        </TooltipContent>
      </Tooltip>
    )
  }

  if (subscription.periodEnd) {
    return `Next payment on ${format(subscription.periodEnd, 'MMM d, yyyy')}`
  }

  return 'No upcoming payment'
}

const renderProFooter = ({
  isPending,
  subscription,
  hasUpcomingTrialEnd,
  isOpening,
  openBillingPortal,
  isUpgrading,
  upgrade,
  isYearly,
}: {
  isPending: boolean
  subscription: ReturnType<typeof useSubscription>['subscription']
  hasUpcomingTrialEnd: boolean
  isOpening: boolean
  openBillingPortal: () => void
  isUpgrading: boolean
  upgrade: (yearly: boolean) => void
  isYearly: boolean
}) => {
  if (isPending) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-30" />
        <Skeleton className="h-5 w-30" />
      </div>
    )
  }

  if (subscription) {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="xs"
          variant="outline"
          disabled={isOpening}
          onClick={() => openBillingPortal()}
        >
          <LoadingContent loading={isOpening}>
            <HugeiconsIcon
              icon={Wallet01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
            Manage Subscription
          </LoadingContent>
        </Button>
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <HugeiconsIcon
            icon={Clock01Icon}
            strokeWidth={2}
            className="size-3.5"
          />
          {renderSubscriptionStatus({ subscription, hasUpcomingTrialEnd })}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <Button
        size="xs"
        disabled={isUpgrading}
        onClick={() => upgrade(isYearly)}
      >
        <LoadingContent loading={isUpgrading}>Upgrade to Pro</LoadingContent>
      </Button>
      <span className="text-muted-foreground text-xs">
        7-day free trial included
      </span>
    </div>
  )
}

export const Subscription = () => {
  const { period } = useSearch()
  const { subscription, isPending } = useSubscription()
  const router = useRouter()
  const returnHref = router.buildLocation({ to: '/account' }).href
  const { openBillingPortal, isOpening } = useBillingPortal({ returnHref })
  const { upgrade, isUpgrading } = useUpgradeSubscription()
  const [isYearly, setIsYearly] = useState(period === 'yearly')
  const [mountedAt, setMountedAt] = useState(() => Date.now())
  void setMountedAt
  const hasUpcomingTrialEnd = Boolean(
    subscription?.trialEnd && subscription.trialEnd.getTime() > mountedAt
  )

  if (subscription && subscription.period === 'yearly' && !isYearly) {
    setIsYearly(true)
  }

  const plans: (PricingPlan & {
    footer?: ReactNode
  })[] = [
    HOBBY_PLAN,
    {
      ...PRO_PLAN,
      footer: renderProFooter({
        isPending,
        subscription,
        hasUpcomingTrialEnd,
        isOpening,
        openBillingPortal,
        isUpgrading,
        upgrade,
        isYearly,
      }),
    },
  ]

  return (
    <>
      {subscription?.status === 'past_due' && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle className="flex items-center gap-2">
            <HugeiconsIcon
              icon={Alert02Icon}
              strokeWidth={2}
              className="text-destructive size-4"
            />
            Payment issue with your subscription
          </AlertTitle>
          <AlertDescription>{SUBSCRIPTION_PAST_DUE_MESSAGE}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader className="flex flex-row justify-between space-y-0">
          <div className="flex flex-col">
            <CardTitle className="flex items-center gap-2">
              Subscription
              {isPending && (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className={cn('size-4 animate-spin')}
                />
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              Manage your subscription
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-label="About subscription support"
                      className="inline-flex focus:outline-none"
                    />
                  }
                >
                  <HugeiconsIcon
                    icon={InformationCircleIcon}
                    strokeWidth={2}
                    className="size-4"
                  />
                </TooltipTrigger>
                <TooltipContent className="bg-background max-w-xs p-0">
                  <div className="from-primary/5 to-card space-y-4 bg-linear-to-b p-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/20 text-primary inline-flex size-6 items-center justify-center rounded-full">
                        <HugeiconsIcon
                          icon={FavouriteIcon}
                          strokeWidth={2}
                          className="size-4"
                        />
                      </span>
                      <span className="text-primary font-semibold">
                        Tamery is indie & user-supported
                      </span>
                    </div>
                    <p className="text-foreground text-balance">
                      Our small team works every day to improve Tamery without
                      sponsors or VCs, and on our own terms.
                    </p>
                    <p className="text-muted-foreground text-balance">
                      Your subscription directly supports our work and future
                      development.
                    </p>
                    <p className="text-foreground font-medium text-balance">
                      Thank you for helping us stay independent.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </CardDescription>
          </div>
          {!subscription && !isPending && (
            <div className="flex items-center">
              <div className="bg-card inline-flex items-center rounded-full border p-1 shadow-sm">
                {['Monthly', 'Yearly'].map((billingPeriod) => (
                  <button
                    type="button"
                    key={billingPeriod}
                    onClick={() => setIsYearly(billingPeriod === 'Yearly')}
                    className={cn(
                      `rounded-full px-3 py-1 text-sm font-medium transition-all duration-100`,
                      (billingPeriod === 'Yearly') === isYearly
                        ? 'bg-primary text-primary-foreground'
                        : `text-muted-foreground hover:text-foreground`
                    )}
                  >
                    {billingPeriod}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid-cols-2 gap-6 lg:grid">
            {plans.map((plan, planIndex) => (
              <div
                key={plan.name}
                className={cn(
                  `flex h-50 flex-col justify-between rounded-lg border p-4 duration-100`
                )}
              >
                <div className="flex flex-col gap-4">
                  <span
                    className={cn(
                      `bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md duration-100`
                    )}
                  >
                    <HugeiconsIcon
                      icon={plan.icon}
                      strokeWidth={2}
                      className="size-5 duration-100"
                    />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 text-lg">
                      <span className="font-medium">
                        {plan.name}{' '}
                        {plan.price.monthly > 0 && (
                          <span className="text-muted-foreground text-sm font-normal">
                            {subscription &&
                            subscription.plan === plan.name.toLowerCase()
                              ? formatCurrency(subscription.price)
                              : formatCurrency(
                                  isYearly
                                    ? plan.price.yearly
                                    : plan.price.monthly
                                )}
                            {subscription?.period === 'yearly'
                              ? '/year'
                              : '/month'}
                          </span>
                        )}
                      </span>
                      {!isPending &&
                        (subscription?.plan === plan.name.toLowerCase() ||
                          (!subscription && planIndex === 0)) && (
                          <Badge variant="secondary">Current</Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground text-sm">
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
    </>
  )
}
