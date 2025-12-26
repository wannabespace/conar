import { Store } from '@tanstack/react-store'

export const actionsCenterStore = new Store({
  isOpen: false,
})

export function setIsOpen(isOpen: boolean) {
  actionsCenterStore.setState(state => ({ ...state, isOpen }))
}
