import type { IconSvgElement } from '@hugeicons/react'

import type { ShortcutId } from '~/core/keyboard/shortcuts'
import type { TabContext } from '~/core/tabs/types'

export interface CommandEntry {
  action: () => void
  group: 'Navigation' | 'Database' | 'View' | 'Application'
  icon: IconSvgElement
  keywords: string[]
  order: number
  shortcut?: ShortcutId
  value: string
}

export interface CommandContext {
  current?: TabContext
  tabId?: string
}
