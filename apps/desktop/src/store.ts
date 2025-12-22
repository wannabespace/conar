import { sessionStorageValue } from '@conar/ui/hookas/use-session-storage'
import { Store } from '@tanstack/react-store'

export const subscriptionModalIsOpen = sessionStorageValue<boolean>('subscriptionModalIsOpen', false)

export const appStore = new Store({
  actionsCenterIsOpen: false,
  subscriptionModalIsOpen: subscriptionModalIsOpen.get(),
})

subscriptionModalIsOpen.remove()
