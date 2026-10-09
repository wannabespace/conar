import {
  McpServerIcon,
  PaintBoardIcon,
  SecurityLockIcon,
  Settings02Icon,
} from '@hugeicons/core-free-icons'

import { McpSettings } from '~/modules/mcp/mcp-settings'

import { AppearanceSettings } from './appearance'
import { GeneralSettings } from './general'
import { PrivacySettings } from './privacy'

export const settingsSections = [
  {
    component: GeneralSettings,
    icon: Settings02Icon,
    label: 'General',
    slug: 'general',
  },
  {
    component: AppearanceSettings,
    icon: PaintBoardIcon,
    label: 'Appearance',
    slug: 'appearance',
  },
  ...(window.electron
    ? [
        {
          component: McpSettings,
          icon: McpServerIcon,
          label: 'MCP',
          slug: 'mcp',
        },
      ]
    : []),
  {
    component: PrivacySettings,
    icon: SecurityLockIcon,
    label: 'Privacy',
    slug: 'privacy',
  },
]
