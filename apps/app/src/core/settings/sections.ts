import { SecurityLockIcon, Settings02Icon } from '@hugeicons/core-free-icons'

import type { SettingsSection } from '~/lib/module'
import { byOrder } from '~/lib/modules'
import { protectedModules } from '~/lib/protected-modules'

import { GeneralSettings } from './general-settings'
import { PrivacySettings } from './privacy-settings'

const coreSections: SettingsSection[] = [
  {
    Component: GeneralSettings,
    icon: Settings02Icon,
    id: 'general',
    label: 'General',
    order: 0,
  },
  {
    Component: PrivacySettings,
    icon: SecurityLockIcon,
    id: 'privacy',
    label: 'Privacy',
    order: 100,
  },
]

export const settingsSections = () =>
  byOrder([...coreSections, ...protectedModules.settings])
