import { uppercaseFirst } from '@conar/shared/utils/helpers'
import { Alert, AlertDescription } from '@conar/ui/components/alert'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@conar/ui/components/card'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@conar/ui/components/dialog'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowUpLine, RiCloseLine, RiInformationLine, RiRefreshLine, RiVipCrownLine, RiWalletLine } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import dayjs from 'dayjs'
import { useBillingPortal, useCancelSubscription, useRestoreSubscription, useSubscription, useUpgradeSubscription } from '~/entities/user/hooks/use-subscription'
import { appStore } from '~/store'

function formatDate(date: Date | null | undefined) {
  return date ? dayjs(date).format('MMMM D, YYYY') : 'N/A'
}

function SubscriptionDetails({ subscription }: {
  subscription: NonNullable<ReturnType<typeof useSubscription>['subscription']>
}) {
  const isTrialing = subscription.status === 'trialing'
  const isActive = subscription.status === 'active'

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex size-12 items-center justify-center rounded-lg',
                  isActive || isTrialing ? 'bg-primary/10' : 'bg-muted',
                )}
              >
                <RiVipCrownLine
                  className={cn(
                    'size-6',
                    isActive || isTrialing
                      ? 'text-primary'
                      : 'text-muted-foreground',
                  )}
                />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold capitalize">
                  {subscription.plan}
                </CardTitle>
                <CardDescription className="text-base">
                  Current Plan
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={isActive ? 'default' : isTrialing ? 'secondary' : 'outline'}
              className="px-3 py-1 text-sm"
            >
              {uppercaseFirst(subscription.status)}
            </Badge>
          </div>
        </CardHeader>
      </Card>
      {subscription.status === 'trialing' && subscription.trialEnd && (
        <Alert variant="success">
          <RiInformationLine className="size-5 text-success" />
          <AlertDescription className="text-sm">
            You're currently on a free trial that ends on
            {' '}
            <strong className="font-semibold text-success">{formatDate(subscription.trialEnd)}</strong>
            . Your subscription will automatically start after the trial period.
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subscription Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className={`
                text-xs font-medium tracking-wider text-muted-foreground
                uppercase
              `}
              >
                Status
              </p>
              <p className="text-lg font-semibold">
                {uppercaseFirst(subscription.status)}
              </p>
            </div>
            {subscription.cancelAtPeriodEnd && (
              <div className="space-y-1">
                <p className={`
                  text-xs font-medium tracking-wider text-muted-foreground
                  uppercase
                `}
                >
                  Cancellation
                </p>
                <p className="text-lg font-semibold text-warning">
                  Cancels at period end
                </p>
              </div>
            )}
            {subscription.periodEnd && (
              <div className="space-y-1">
                <p className={`
                  text-xs font-medium tracking-wider text-muted-foreground
                  uppercase
                `}
                >
                  {subscription.status === 'trialing' && subscription.trialEnd ? 'Trial ends' : 'Renews on'}
                </p>
                <p className="text-lg font-semibold">
                  {formatDate(subscription.status === 'trialing' && subscription.trialEnd ? subscription.trialEnd : subscription.periodEnd)}
                </p>
              </div>
            )}
            {subscription.periodStart && (
              <div className="space-y-1">
                <p className={`
                  text-xs font-medium tracking-wider text-muted-foreground
                  uppercase
                `}
                >
                  Period start
                </p>
                <p className="text-lg font-semibold">
                  {formatDate(subscription.periodStart)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {subscription.cancelAtPeriodEnd && (
        <Alert variant="warning">
          <RiInformationLine className="size-5 text-warning" />
          <AlertDescription className="text-sm">
            Your subscription will remain active until
            {' '}
            <strong className="font-semibold text-warning">{formatDate(subscription.periodEnd)}</strong>
            , after which it will be cancelled.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function SubscriptionActions({
  subscription,
  onRestore,
  onCancel,
  onOpenBillingPortal,
  isRestoring,
  isCancelling,
  isOpening,
}: {
  subscription: NonNullable<ReturnType<typeof useSubscription>['subscription']>
  onRestore: () => void
  onCancel: () => void
  onOpenBillingPortal: () => void
  isRestoring: boolean
  isCancelling: boolean
  isOpening: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Subscription Actions</CardTitle>
        <CardDescription>
          Manage your subscription, payment method, and billing settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {subscription.cancelAtPeriodEnd
          ? (
              <Button
                variant="default"
                onClick={onRestore}
                disabled={isRestoring}
                size="lg"
              >
                <LoadingContent loading={isRestoring}>
                  <RiRefreshLine className="size-4" />
                  Restore Subscription
                </LoadingContent>
              </Button>
            )
          : subscription.status === 'active' || subscription.status === 'trialing'
            ? (
                <Button
                  variant="destructive"
                  onClick={onCancel}
                  disabled={isCancelling}
                  size="lg"
                >
                  <LoadingContent loading={isCancelling}>
                    <RiCloseLine className="size-4" />
                    Cancel Subscription
                  </LoadingContent>
                </Button>
              )
            : null}

        <Button
          variant="outline"
          onClick={onOpenBillingPortal}
          disabled={isOpening}
          size="lg"
        >
          <LoadingContent loading={isOpening}>
            <RiWalletLine className="size-4" />
            Open Stripe Billing Portal
          </LoadingContent>
        </Button>
      </CardContent>
    </Card>
  )
}

function NoSubscription() {
  const { upgrade, isUpgrading } = useUpgradeSubscription()

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className={`
              flex size-12 items-center justify-center rounded-lg bg-muted
            `}
            >
              <RiVipCrownLine className="size-6 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Hobby</CardTitle>
              <CardDescription className="text-base">
                Current Plan
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upgrade to Pro</CardTitle>
          <CardDescription>
            You're currently on the free Hobby plan. Upgrade to Pro to unlock advanced features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <RiInformationLine className="size-5 text-primary" />
            <AlertDescription className="text-sm">
              Pro plan includes a 7-day free trial. No credit card required until the trial ends.
            </AlertDescription>
          </Alert>

          <Button
            onClick={() => upgrade()}
            disabled={isUpgrading}
            size="lg"
          >
            <LoadingContent loading={isUpgrading}>
              <RiArrowUpLine className="size-4" />
              Upgrade to Pro
            </LoadingContent>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function SubscriptionModal() {
  const { subscription } = useSubscription()
  const { cancel, isCancelling } = useCancelSubscription()
  const { restore, isRestoring } = useRestoreSubscription()
  const { openBillingPortal, isOpening } = useBillingPortal()
  const isOpen = useStore(appStore, state => state.subscriptionModalIsOpen)

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        appStore.setState(state => ({ ...state, subscriptionModalIsOpen: open } satisfies typeof state))
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Subscription</DialogTitle>
          <DialogDescription className="text-base">
            View your subscription plan and access Stripe billing portal
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          {subscription
            ? (
                <div className="space-y-6">
                  <SubscriptionDetails subscription={subscription} />
                  <SubscriptionActions
                    subscription={subscription}
                    onRestore={() => restore()}
                    onCancel={() => cancel()}
                    onOpenBillingPortal={() => openBillingPortal()}
                    isRestoring={isRestoring}
                    isCancelling={isCancelling}
                    isOpening={isOpening}
                  />
                </div>
              )
            : <NoSubscription />}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => appStore.setState(state => ({ ...state, subscriptionModalIsOpen: false } satisfies typeof state))}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
