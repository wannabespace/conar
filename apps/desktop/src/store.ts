import { Store } from '@tanstack/react-store'

export const appStore = new Store({
  actionsCenterIsOpen: false,
})

export function setActionsCenterIsOpen(isOpen: boolean) {
  appStore.setState(state => ({ ...state, actionsCenterIsOpen: isOpen } satisfies typeof state))
}
