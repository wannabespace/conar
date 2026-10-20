import {
  KeyboardIcon,
  McpServerIcon,
  PaintBoardIcon,
  Settings02Icon,
  Share08Icon,
} from '@hugeicons/core-free-icons'

import { McpSettings } from '~/modules/mcp/mcp-settings'
import { ShareSettings } from '~/modules/share/share-settings'

import { AppearanceSettings } from './appearance'
import { GeneralSettings } from './general'
import { KeyboardSettings } from './keyboard'

export const settingsSections = [
  ...(window.electron
    ? [
        {
          component: GeneralSettings,
          icon: Settings02Icon,
          label: 'General',
          slug: 'general',
        },
      ]
    : []),
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
  {
    component: ShareSettings,
    icon: Share08Icon,
    label: 'Shares',
    slug: 'shares',
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
