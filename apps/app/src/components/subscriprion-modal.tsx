import { Button } from '@conar/ui/components/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@conar/ui/components/dialog'
import { RiExternalLinkLine, RiVipCrownLine } from '@remixicon/react'
import { useEffect } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'
import { useSubscription as useUserSubscription } from '~/entities/user/hooks'
import { appStore, setIsSubscriptionDialogOpen } from '~/store'

export function SubscriptionModal() {
  const isSubscriptionDialogOpen = useSubscription(appStore, { selector: state => state.isSubscriptionDialogOpen })
  const { subscription } = useUserSubscription()

  useEffect(() => {
    if (isSubscriptionDialogOpen && subscription) {
      setIsSubscriptionDialogOpen(false)
      toast.success('Subscription successful! Conar Pro features are now unlocked.')
    }
  }, [isSubscriptionDialogOpen, subscription])

  const accountUrl = `${import.meta.env.VITE_PUBLIC_MAIN_URL}/account`

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
            <DialogTitle className="font-semibold text-primary">Pro Feature</DialogTitle>
          </div>
          <DialogDescription className="text-foreground">
            Subscribe to Pro to access this feature and unlock the full power of Conar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <div className="
            flex items-start gap-3 rounded-lg bg-muted/50 px-6 py-2
          "
          >
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
            className={`
              w-full
              sm:w-auto
            `}
            render={<a href={accountUrl} target="_blank" rel="noopener noreferrer" />}
          >
            Upgrade to Pro
            <RiExternalLinkLine className="size-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
