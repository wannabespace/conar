import type { IconSvgElement } from '@hugeicons/react'

import type { TabContext } from '~/core/tabs/types'

export interface CommandEntry {
  action: () => void
  group: 'Navigation' | 'Database' | 'View' | 'Application'
  icon: IconSvgElement
  keywords: string[]
  order: number
  shortcut?: string
  value: string
}

export interface CommandContext {
  current?: TabContext
  tabId?: string
}
