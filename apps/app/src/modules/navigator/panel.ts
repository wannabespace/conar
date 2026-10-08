import type { Panel } from '~/lib/panels'

import { Navigator } from './navigator'
import { navigatorOpenValue } from './stores'

export const navigatorPanel: Panel = {
  Component: Navigator,
  // Sync with settingsSidebarClassName's width in shell.tsx.
  defaultSize: 280,
  id: 'navigator',
  label: 'navigator',
  maxSize: '50%',
  minSize: 220,
  open: () => navigatorOpenValue,
  region: 'left',
}
