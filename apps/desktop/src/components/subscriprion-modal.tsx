import { Button } from '@conar/ui/components/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@conar/ui/components/dialog'
import { RiExternalLinkLine, RiSparklingFill, RiVipCrownLine } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { useEffect } from 'react'
import { useSubscription } from '~/entities/user/hooks'
import { appStore, setIsSubscriptionDialogOpen } from '~/store'

export function SubscriptionModal() {
  const isSubscriptionDialogOpen = useStore(appStore, state => state.isSubscriptionDialogOpen)
  const { subscription } = useSubscription()

  useEffect(() => {
    if (subscription) {
      setIsSubscriptionDialogOpen(false)
    }
  }, [subscription])

  const accountUrl = `${import.meta.env.VITE_PUBLIC_WEB_URL}/account`

  return (
    <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
      <DialogContent className={`
        max-w-md bg-linear-to-b from-primary/5 via-background to-background
      `}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className={`
              flex size-7 shrink-0 items-center justify-center rounded-full
              bg-primary/10
            `}
            >
              <RiVipCrownLine className="size-4 text-primary" />
            </div>
            <DialogTitle className="font-semibold text-primary">Pro Features</DialogTitle>
          </div>
          <DialogDescription className="text-foreground">
            Subscribe to Pro to access this feature and unlock the full power of Conar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
            <RiSparklingFill className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Conar is indie & user-supported</p>
              <p className="text-sm text-muted-foreground">
                Your subscription directly supports our work and future development.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className={`
          flex-col gap-2
          sm:flex-row
        `}
        >
          <Button
            variant="outline"
            onClick={() => setIsSubscriptionDialogOpen(false)}
            className={`
              w-full
              sm:w-auto
            `}
          >
            Maybe Later
          </Button>
          <Button
            asChild
            className={`
              w-full
              sm:w-auto
            `}
          >
            <a href={accountUrl} target="_blank" rel="noopener noreferrer">
              Upgrade to Pro
              <RiExternalLinkLine className="size-4" />
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
