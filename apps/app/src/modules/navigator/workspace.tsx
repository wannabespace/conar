import { useHotkey } from '@tanstack/react-hotkeys'

import type { WorkspaceModule } from '~/lib/module'

import { useEscapeToNavigator } from './keyboard'
import { Navigator } from './navigator'
import { navigatorOpenValue } from './stores'

const NavigatorHotkey = () => {
  useHotkey('Mod+B', (e) => {
    e.preventDefault()
    navigatorOpenValue.set((open) => !open)
  })
  useEscapeToNavigator()

  return null
}

export default {
  mounts: [NavigatorHotkey],
  panels: [
    {
      Component: Navigator,
      defaultSize: 280,
      id: 'navigator',
      label: 'navigator',
      maxSize: '50%',
      minSize: 220,
      open: () => navigatorOpenValue,
      region: 'left',
    },
  ],
} satisfies WorkspaceModule
