import { createStore } from 'seitu'

export const appStore = createStore({
  isActionCenterOpen: false,
  isSubscriptionDialogOpen: false,
  isSignInDialogOpen: false,
  isOnline: window.navigator.onLine,
})

function updateOnline() {
  appStore.set(state => ({ ...state, isOnline: window.navigator.onLine } satisfies typeof state))
}

window.addEventListener('online', () => updateOnline())
window.addEventListener('offline', () => updateOnline())

export function setIsActionCenterOpen(isOpen: boolean) {
  appStore.set(state => ({ ...state, isActionCenterOpen: isOpen } satisfies typeof state))
}

export function setIsSubscriptionDialogOpen(isOpen: boolean) {
  appStore.set(state => ({ ...state, isSubscriptionDialogOpen: isOpen } satisfies typeof state))
}

export function setIsSignInDialogOpen(isOpen: boolean) {
  appStore.set(state => ({ ...state, isSignInDialogOpen: isOpen } satisfies typeof state))
}
