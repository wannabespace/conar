import {
  KeyboardIcon,
  McpServerIcon,
  PaintBoardIcon,
  SecurityLockIcon,
} from '@hugeicons/core-free-icons'

import { McpSettings } from '~/modules/mcp/mcp-settings'

import { AppearanceSettings } from './appearance'
import { KeyboardSettings } from './keyboard'
import { PrivacySettings } from './privacy'

export const settingsSections = [
  {
    component: AppearanceSettings,
    icon: PaintBoardIcon,
    label: 'Appearance',
    slug: 'appearance',
  },
  {
    component: KeyboardSettings,
    icon: KeyboardIcon,
    label: 'Keyboard',
    slug: 'keyboard',
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
