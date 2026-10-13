import {
  KeyboardIcon,
  McpServerIcon,
  PaintBoardIcon,
  Settings02Icon,
} from '@hugeicons/core-free-icons'

import { McpSettings } from '~/modules/mcp/mcp-settings'

import { AppearanceSettings } from './appearance'
import { GeneralSettings } from './general'
import { KeyboardSettings } from './keyboard'

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
]
