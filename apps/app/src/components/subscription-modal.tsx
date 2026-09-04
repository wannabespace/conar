import {
  CloudIcon,
  CrownIcon,
  DatabaseIcon,
  LinkSquare02Icon,
  SparklesIcon,
} from '@hugeicons/core-free-icons'
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

import { useSubscription as useUserSubscription } from '~/entities/user/hooks'
import { accountUrl } from '~/lib/urls'
import { appStore, setIsSubscriptionDialogOpen } from '~/store'

const perks = [
  {
    icon: DatabaseIcon,
    label: 'Unlimited connections and workspaces',
  },
  {
    icon: SparklesIcon,
    label: 'Unlimited AI assistant',
  },
  {
    icon: CloudIcon,
    label: 'Cloud sync on all your devices',
  },
]

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

  return (
    <Dialog
      open={isSubscriptionDialogOpen}
      onOpenChange={setIsSubscriptionDialogOpen}
    >
      <DialogContent className="from-primary/8 via-background to-background gap-7 bg-linear-to-b via-40% sm:max-w-lg">
        <DialogHeader className="items-center gap-2 pt-4 text-center">
          <div className="relative mb-2">
            <div className="bg-primary/20 absolute -inset-5 rounded-full blur-2xl" />
            <div className="bg-primary/10 inset-ring-primary/15 relative flex size-14 items-center justify-center rounded-2xl inset-ring">
              <HugeiconsIcon
                icon={CrownIcon}
                strokeWidth={2}
                className="text-primary size-7"
              />
            </div>
          </div>
          <DialogTitle className="text-lg font-semibold">
            Tamery Pro
          </DialogTitle>
          <DialogDescription>
            Everything Tamery can do, without limits.
          </DialogDescription>
        </DialogHeader>
        <ul className="divide-foreground/5 bg-foreground/3 divide-y rounded-xl">
          {perks.map((perk) => (
            <li key={perk.label} className="flex items-center gap-3 px-4 py-3">
              <HugeiconsIcon
                icon={perk.icon}
                strokeWidth={2}
                className="text-primary size-4.5 shrink-0"
              />
              <span className="text-sm">{perk.label}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-4">
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSubscriptionDialogOpen(false)}
              className="sm:flex-1"
            >
              Maybe Later
            </Button>
            <Button
              className="sm:flex-1"
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
          <p className="text-muted-foreground text-center text-xs">
            Indie-built and user-supported — your subscription funds
            development.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
