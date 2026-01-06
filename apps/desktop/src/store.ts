import { Store } from '@tanstack/react-store'

export const appStore = new Store({
  isActionCenterOpen: false,
  isSubscriptionDialogOpen: false,
})

export function setIsActionCenterOpen(isOpen: boolean) {
  appStore.setState(state => ({ ...state, isActionCenterOpen: isOpen } satisfies typeof state))
}

export function setIsSubscriptionDialogOpen(isOpen: boolean) {
  appStore.setState(state => ({ ...state, isSubscriptionDialogOpen: isOpen } satisfies typeof state))
}
