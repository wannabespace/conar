import type { ReactNode } from 'react'
import type { PricingPlan } from '~/utils/pricing'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@conar/ui/components/card'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Skeleton } from '@conar/ui/components/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiLoader4Fill, RiTimeLine, RiWalletLine } from '@remixicon/react'
import { useRouter } from '@tanstack/react-router'
import { format, formatDistanceToNow } from 'date-fns'
import { useBillingPortal, useSubscription, useUpgradeSubscription } from '~/hooks/use-subscription'
import { HOBBY_PLAN, PRO_PLAN } from '~/utils/pricing'

export function Subscription() {
  const { subscription, isPending } = useSubscription()
  const router = useRouter()
  const returnUrl = router.buildLocation({ to: '/account' }).url.href
  const { openBillingPortal, isOpening } = useBillingPortal({ returnUrl })
  const { upgrade, isUpgrading } = useUpgradeSubscription()

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
                  onClick={() => upgrade()}
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Subscription
          {isPending && (
            <RiLoader4Fill
              className={cn('size-4 animate-spin')}
            />
          )}
        </CardTitle>
        <CardDescription>Manage your subscription</CardDescription>
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
                    <span className="font-medium">{plan.name}</span>
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

  // <div className="space-y-6 py-2">
  //   <Card className="border-2">
  //     <CardHeader className="pb-4">
  //       <div className="flex items-center justify-between">
  //         <div className="flex items-center gap-3">
  //           <div className={cn(
  //             'flex size-12 items-center justify-center rounded-lg',
  //             (isActive || isTrialing) ? 'bg-primary/10' : 'bg-muted',
  //           )}
  //           >
  //             <RiVipCrownLine
  //               className={cn(
  //                 'size-6',
  //                 (isActive || isTrialing)
  //                   ? 'text-primary'
  //                   : 'text-muted-foreground',
  //               )}
  //             />
  //           </div>
  //           <div>
  //             <CardTitle className="text-2xl font-bold capitalize">{subscription.plan}</CardTitle>
  //             <CardDescription className="text-base">Current Plan</CardDescription>
  //           </div>
  //         </div>
  //         <Badge
  //           variant={isActive ? 'default' : isTrialing ? 'secondary' : 'outline'}
  //           className="px-3 py-1 text-sm"
  //         >
  //           {uppercaseFirst(subscription.status)}
  //         </Badge>
  //       </div>
  //     </CardHeader>
  //   </Card>

  //   <Card>
  //     <CardHeader>
  //       <CardTitle className="text-lg">Subscription Details</CardTitle>
  //     </CardHeader>
  //     <CardContent>
  //       <div className="grid grid-cols-2 gap-6">
  //         <DetailField label="Status" value={uppercaseFirst(subscription.status)} />
  //         {subscription.cancelAtPeriodEnd && (
  //           <DetailField
  //             label="Cancellation"
  //             value="Cancels at period end"
  //             className="text-warning"
  //           />
  //         )}
  //         {endDate && (
  //           <DetailField
  //             label={isTrialing && subscription.trialEnd ? 'Trial ends' : 'Renews on'}
  //             value={formatDate(endDate)}
  //           />
  //         )}
  //         {subscription.periodStart && (
  //           <DetailField label="Period start" value={formatDate(subscription.periodStart)} />
  //         )}
  //       </div>
  //     </CardContent>
  //   </Card>

  //   {subscription.cancelAtPeriodEnd && subscription.periodEnd && (
  //     <Alert variant="warning">
  //       <RiInformationLine className="size-5 text-warning" />
  //       <AlertDescription className="text-sm">
  //         Your subscription will remain active until
  //         {' '}
  //         <strong className="font-semibold text-warning">{formatDate(subscription.periodEnd)}</strong>
  //         ,
  //         after which it will be cancelled.
  //       </AlertDescription>
  //     </Alert>
  //   )}

  //   <Card>
  //     <CardHeader>
  //       <CardTitle className="text-lg">Subscription Actions</CardTitle>
  //       <CardDescription>
  //         Manage your subscription, payment method, and billing settings.
  //       </CardDescription>
  //     </CardHeader>
  //     <CardContent className="space-y-3">
  //       {subscription.cancelAtPeriodEnd
  //         ? (
  //             <Button variant="default" onClick={() => restore()} disabled={isRestoring} size="lg">
  //               <LoadingContent loading={isRestoring}>
  //                 <RiRefreshLine className="size-4" />
  //                 Restore Subscription
  //               </LoadingContent>
  //             </Button>
  //           )
  //         : (isActive || isTrialing) && (
  //             <Button variant="destructive" onClick={() => cancel()} disabled={isCancelling} size="lg">
  //               <LoadingContent loading={isCancelling}>
  //                 <RiCloseLine className="size-4" />
  //                 Cancel Subscription
  //               </LoadingContent>
  //             </Button>
  //           )}
  //       <Button variant="outline" onClick={() => openBillingPortal()} disabled={isOpening} size="lg">
  //         <LoadingContent loading={isOpening}>
  //           <RiWalletLine className="size-4" />
  //           Open Stripe Billing Portal
  //         </LoadingContent>
  //       </Button>
  //     </CardContent>
  //   </Card>
  // </div>
}
