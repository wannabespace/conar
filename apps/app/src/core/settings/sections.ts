import {
  KeyboardIcon,
  Link01Icon,
  McpServerIcon,
  PaintBoardIcon,
  SecurityLockIcon,
} from '@hugeicons/core-free-icons'

import { ConnectionLinksSettings } from '~/modules/connection-links/connection-links-settings'
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
        {
          component: ConnectionLinksSettings,
          icon: Link01Icon,
          label: 'Links',
          slug: 'links',
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
