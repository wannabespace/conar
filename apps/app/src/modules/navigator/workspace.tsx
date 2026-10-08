import { useHotkey } from '@tanstack/react-hotkeys'

import type { WorkspaceModule } from '~/lib/module'

import { Navigator } from './navigator'
import { navigatorOpenValue } from './stores'

const NavigatorHotkey = () => {
  useHotkey('Mod+B', (e) => {
    e.preventDefault()
    navigatorOpenValue.set((open) => !open)
  })

  return null
}

export default {
  mounts: [NavigatorHotkey],
  panels: [
    {
      Component: Navigator,
      // Sync with settingsSidebarClassName's width in shell.tsx.
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
