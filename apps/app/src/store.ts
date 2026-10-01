import { createStore } from 'seitu'

export const appStore = createStore({
  isOnline: window.navigator.onLine,
  isSubscriptionDialogOpen: false,
})

const updateOnline = () => {
  appStore.set(
    (state) =>
      ({ ...state, isOnline: window.navigator.onLine }) satisfies typeof state
  )
}

window.addEventListener('online', () => updateOnline())
window.addEventListener('offline', () => updateOnline())

export const setIsSubscriptionDialogOpen = (isOpen: boolean) => {
  appStore.set(
    (state) =>
      ({ ...state, isSubscriptionDialogOpen: isOpen }) satisfies typeof state
  )
}
