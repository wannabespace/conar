import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@conar/ui/components/dialog'
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

  return (
    <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subscription</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
