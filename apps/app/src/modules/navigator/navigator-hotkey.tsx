import { useHotkey } from '@tanstack/react-hotkeys'

import { navigatorOpenValue } from './stores'

export const NavigatorHotkey = () => {
  useHotkey('Mod+B', (e) => {
    e.preventDefault()
    navigatorOpenValue.set((open) => !open)
  })

  return null
}
