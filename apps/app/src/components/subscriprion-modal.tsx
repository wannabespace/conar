import { RiExternalLinkLine, RiVipCrownLine } from '@remixicon/react'
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

import { useSubscription as useUserSubscription } from '~/entities/user/hooks'
import { appStore, setIsSubscriptionDialogOpen } from '~/store'

export const SubscriptionModal = () => {
  const isSubscriptionDialogOpen = useSubscription(appStore, {
    selector: (state) => state.isSubscriptionDialogOpen,
  })
  const { subscription } = useUserSubscription()

  useEffect(() => {
    if (isSubscriptionDialogOpen && subscription) {
      setIsSubscriptionDialogOpen(false)
      toast.success(
        'Subscription successful! Tamery Pro features are now unlocked.'
      )
    }
  }, [isSubscriptionDialogOpen, subscription])

  const accountUrl = `${import.meta.env.VITE_PUBLIC_MAIN_URL}/account`

  return (
    <Dialog
      open={isSubscriptionDialogOpen}
      onOpenChange={setIsSubscriptionDialogOpen}
    >
      <DialogContent className="from-primary/5 via-background to-background max-w-md bg-linear-to-b">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 flex size-7 shrink-0 items-center justify-center rounded-full">
              <RiVipCrownLine className="text-primary size-4" />
            </div>
            <DialogTitle className="text-primary font-semibold">
              Pro Feature
            </DialogTitle>
          </div>
          <DialogDescription className="text-foreground">
            Subscribe to Pro to access this feature and unlock the full power of
            Tamery.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <div className="bg-muted/50 flex items-start gap-3 rounded-lg px-6 py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Tamery is indie & user-supported
              </p>
              <p className="text-muted-foreground text-sm">
                Your subscription directly supports our work and future
                development.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => setIsSubscriptionDialogOpen(false)}
            className="w-full sm:w-auto"
          >
            Maybe Later
          </Button>
          <Button
            className="w-full sm:w-auto"
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
            <RiExternalLinkLine className="size-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
