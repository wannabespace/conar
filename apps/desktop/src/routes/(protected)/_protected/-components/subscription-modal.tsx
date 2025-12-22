import { Alert, AlertDescription } from '@conar/ui/components/alert'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@conar/ui/components/dialog'
import { Separator } from '@conar/ui/components/separator'
import { Skeleton } from '@conar/ui/components/skeleton'
import { RiArrowUpLine, RiInformationLine, RiWalletLine } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import dayjs from 'dayjs'
import { useBillingPortal, useSubscription, useSubscriptionsQuery, useUpgradeSubscription } from '~/entities/user/hooks/use-subscription'
import { appStore } from '~/store'

function formatDate(date: Date | string | null | undefined): string {
  if (!date)
    return 'N/A'
  return dayjs(date).format('MMMM D, YYYY')
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function setIsOpen(isOpen: boolean) {
  appStore.setState(state => ({ ...state, subscriptionModalIsOpen: isOpen } satisfies typeof state))
}

export function SubscriptionModal() {
  const { isPending } = useSubscriptionsQuery()
  const subscription = useSubscription()
  const { upgrade, isUpgrading } = useUpgradeSubscription()
  const { openBillingPortal, isOpening } = useBillingPortal()
  const isOpen = useStore(appStore, state => state.subscriptionModalIsOpen)

  const handleUpgrade = () => {
    upgrade()
  }

  const handleBillingPortal = () => {
    openBillingPortal()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Subscription</DialogTitle>
          <DialogDescription>
            View your subscription plan and access Stripe billing portal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isPending
            ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              )
            : subscription
              ? (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Current Plan</h3>
                          <p className="text-sm text-muted-foreground">
                            {subscription.plan}
                          </p>
                        </div>
                        <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                          {formatStatus(subscription.status)}
                        </Badge>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Status
                          </p>
                          <p className="text-base font-semibold">
                            {formatStatus(subscription.status)}
                          </p>
                        </div>
                        {subscription.cancelAtPeriodEnd && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Cancellation
                            </p>
                            <p className="text-base font-semibold text-warning">
                              Cancels at period end
                            </p>
                          </div>
                        )}
                        {subscription.periodEnd && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              {subscription.status === 'trialing' && subscription.trialEnd ? 'Trial ends' : 'Renews on'}
                            </p>
                            <p className="text-base font-semibold">
                              {formatDate(subscription.status === 'trialing' && subscription.trialEnd ? subscription.trialEnd : subscription.periodEnd)}
                            </p>
                          </div>
                        )}
                        {subscription.periodStart && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Period start
                            </p>
                            <p className="text-base font-semibold">
                              {formatDate(subscription.periodStart)}
                            </p>
                          </div>
                        )}
                      </div>

                      {subscription.status === 'trialing' && subscription.trialEnd && (
                        <Alert variant="success">
                          <RiInformationLine />
                          <AlertDescription>
                            You're currently on a free trial that ends on
                            {' '}
                            <strong>{formatDate(subscription.trialEnd)}</strong>
                            . Your subscription will automatically start after the trial period.
                          </AlertDescription>
                        </Alert>
                      )}

                      {subscription.cancelAtPeriodEnd && (
                        <Alert variant="warning">
                          <RiInformationLine />
                          <AlertDescription>
                            Your subscription will remain active until
                            {' '}
                            <strong>{formatDate(subscription.periodEnd)}</strong>
                            , after which it will be cancelled.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Billing Management</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage your payment method, view invoices, and update your subscription settings through Stripe.
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleBillingPortal}
                        disabled={isOpening}
                        className="w-full"
                      >
                        <LoadingContent loading={isOpening}>
                          <RiWalletLine className="size-4" />
                          Open Stripe Billing Portal
                        </LoadingContent>
                      </Button>
                    </div>
                  </>
                )
              : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">No Active Subscription</h3>
                      <p className="text-sm text-muted-foreground">
                        You're currently on the free Hobby plan. Upgrade to Pro to unlock advanced features.
                      </p>
                    </div>

                    <Alert>
                      <RiInformationLine />
                      <AlertDescription>
                        Pro plan includes a 7-day free trial. No credit card required until the trial ends.
                      </AlertDescription>
                    </Alert>

                    <Button
                      onClick={handleUpgrade}
                      disabled={isUpgrading}
                      className="w-full"
                      size="lg"
                    >
                      <LoadingContent loading={isUpgrading}>
                        <RiArrowUpLine className="size-4" />
                        Upgrade to Pro
                      </LoadingContent>
                    </Button>
                  </div>
                )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
