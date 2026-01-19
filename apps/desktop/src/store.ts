import { Store } from '@tanstack/react-store'

export const appStore = new Store({
  isActionCenterOpen: false,
  isSubscriptionDialogOpen: false,
  isOnline: window.navigator.onLine,
  isCreateConnectionDialogOpen: false,
})

function updateOnline() {
  appStore.setState(state => ({ ...state, isOnline: window.navigator.onLine } satisfies typeof state))
}

window.addEventListener('online', () => updateOnline())
window.addEventListener('offline', () => updateOnline())

export function setIsActionCenterOpen(isOpen: boolean) {
  appStore.setState(state => ({ ...state, isActionCenterOpen: isOpen } satisfies typeof state))
}

export function setIsSubscriptionDialogOpen(isOpen: boolean) {
  appStore.setState(state => ({ ...state, isSubscriptionDialogOpen: isOpen } satisfies typeof state))
}

export function setIsCreateConnectionDialogOpen(isOpen: boolean) {
  appStore.setState(state => ({ ...state, isCreateConnectionDialogOpen: isOpen } satisfies typeof state))
}
