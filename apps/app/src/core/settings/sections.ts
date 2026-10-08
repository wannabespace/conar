import {
  PaintBoardIcon,
  SecurityLockIcon,
  Settings02Icon,
} from '@hugeicons/core-free-icons'

import type { SettingsSection } from '~/lib/module'
import { byOrder } from '~/lib/modules'
import { protectedModules } from '~/lib/protected-modules'

const coreSections: SettingsSection[] = [
  {
    icon: Settings02Icon,
    label: 'General',
    order: 0,
    to: '/settings/general',
  },
  {
    icon: PaintBoardIcon,
    label: 'Appearance',
    order: 5,
    to: '/settings/appearance',
  },
  {
    icon: SecurityLockIcon,
    label: 'Privacy',
    order: 100,
    to: '/settings/privacy',
  },
]

export const settingsSections = () =>
  byOrder([...coreSections, ...protectedModules.settings])
