import { LinkSquare02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@tamery/ui/components/dialog'
import { useEffect } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'

import { useSubscription as useUserSubscription } from '~/core/user/use-subscription'
import { posthog } from '~/lib/posthog'
import { accountUrl } from '~/lib/urls'
import { appStore, setIsSubscriptionDialogOpen } from '~/store'

export const SubscriptionModal = () => {
  const { isSubscriptionDialogOpen, upgradeHint } = useSubscription(appStore, {
    selector: (state) => ({
      isSubscriptionDialogOpen: state.isSubscriptionDialogOpen,
      upgradeHint: state.upgradeHint,
    }),
  })
  const { subscription } = useUserSubscription()

  useEffect(() => {
    if (isSubscriptionDialogOpen && subscription) {
      setIsSubscriptionDialogOpen(false)
      posthog.capture('subscription_started')
      toast.success(
        'Subscription successful! Tamery Pro features are now unlocked.'
      )
    }
  }, [isSubscriptionDialogOpen, subscription])

  return (
    <Dialog
      open={isSubscriptionDialogOpen}
      onOpenChange={(open) => setIsSubscriptionDialogOpen(open)}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {upgradeHint
              ? 'You reached the Free limit'
              : 'This one is part of Pro'}
          </DialogTitle>
          <DialogDescription>
            {upgradeHint ??
              'Upgrade to unlock this and everything else. Tamery is independent, and your support is what keeps it going.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsSubscriptionDialogOpen(false)}
          >
            Maybe Later
          </Button>
          <Button
            render={
              <a
                href={accountUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Upgrade to Pro"
              />
            }
          >
            Upgrade to Pro
            <HugeiconsIcon
              icon={LinkSquare02Icon}
              strokeWidth={2}
              className="size-4"
            />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
