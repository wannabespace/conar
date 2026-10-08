import {
  PaintBoardIcon,
  SecurityLockIcon,
  Settings02Icon,
} from '@hugeicons/core-free-icons'

import type { SettingsSection } from '~/lib/module'
import { byOrder } from '~/lib/modules'
import { protectedModules } from '~/lib/protected-modules'

import { AppearanceSettings } from './appearance'
import { GeneralSettings } from './general'
import { PrivacySettings } from './privacy'

const coreSections: SettingsSection[] = [
  {
    component: GeneralSettings,
    icon: Settings02Icon,
    label: 'General',
    order: 0,
    slug: 'general',
  },
  {
    component: AppearanceSettings,
    icon: PaintBoardIcon,
    label: 'Appearance',
    order: 5,
    slug: 'appearance',
  },
  {
    component: PrivacySettings,
    icon: SecurityLockIcon,
    label: 'Privacy',
    order: 100,
    slug: 'privacy',
  },
]

export const settingsSections = () =>
  byOrder([...coreSections, ...protectedModules.settings])
