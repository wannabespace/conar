import type { ReactNode } from 'react'
import { uppercaseFirst } from '@conar/shared/utils/helpers'
import { Alert, AlertDescription, AlertTitle } from '@conar/ui/components/alert'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@conar/ui/components/card'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowUpLine, RiCircleLine, RiCloseLine, RiInformationLine, RiLoader4Fill, RiRefreshLine, RiVipCrownLine, RiWalletLine } from '@remixicon/react'
import { format } from 'date-fns'
import { useBillingPortal, useCancelSubscription, useRestoreSubscription, useSubscription, useUpgradeSubscription } from '~/hooks/use-subscription'

function DetailField({ label, value, className }: { label: string, value: string, className?: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>
      <p className={cn('text-sm font-medium', className)}>
        {value}
      </p>
    </div>
  )
}

function SubscriptionBlock({
  name,
  description,
}: { children: React.ReactNode, name: string, description: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className={`
        flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted
      `}
      >
        <RiVipCrownLine className="size-5 text-muted-foreground" />
      </span>
      <div>
        <AlertTitle className="text-xl font-bold">{name}</AlertTitle>
        <AlertDescription className="text-sm text-nowrap text-muted-foreground">
          {description}
        </AlertDescription>
      </div>
    </div>
  )
}

const formatDate = (date: Date | null | undefined) => date ? format(date, 'MMMM d, yyyy') : 'N/A'

export function Subscription() {
  const { subscription, isPending } = useSubscription()
  const { cancel, isCancelling } = useCancelSubscription()
  const { restore, isRestoring } = useRestoreSubscription()
  const { openBillingPortal, isOpening } = useBillingPortal()
  const { upgrade, isUpgrading } = useUpgradeSubscription()

  const isActive = subscription?.status === 'active'
  const isTrialing = subscription?.status === 'trialing'
  const endDate = isTrialing && subscription?.trialEnd ? subscription?.trialEnd : subscription?.periodEnd

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
          <div className={`
            flex h-50 flex-col justify-between rounded-lg border p-4
          `}
          >
            <div className="flex flex-col gap-4">
              <span className={`
                flex size-10 shrink-0 items-center justify-center rounded-md
                bg-muted
              `}
              >
                <RiCircleLine className="size-5 text-muted-foreground" />
              </span>
              <div>
                <div className="flex items-center gap-2 text-lg">
                  <span className="font-medium">Hobby</span>
                  {!subscription && (
                    <Badge variant="secondary">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Perfect for discover the app and explore the core features
                </p>
              </div>
            </div>
            <div className="">
              456
            </div>
          </div>
          <Alert className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className={`
                flex size-10 shrink-0 items-center justify-center rounded-md
                bg-muted
              `}
              >
                <RiVipCrownLine className="size-5 text-muted-foreground" />
              </span>
              <div>
                <AlertTitle className="text-lg font-bold">Hobby</AlertTitle>
                <AlertDescription className="text-sm text-muted-foreground">
                  Perfect for discover the app and explore the core features
                </AlertDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Button
                size="sm"
                disabled={isUpgrading}
                onClick={() => upgrade()}
              >
                <LoadingContent loading={isUpgrading}>
                  <RiArrowUpLine className="size-4" />
                  Upgrade to Pro
                </LoadingContent>
              </Button>
              <span className={`
                max-w-sm text-right text-xs text-balance text-muted-foreground
              `}
              >
                7-day free trial included
              </span>
            </div>
          </Alert>
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
