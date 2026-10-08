import type { RegisteredRouter } from '@tanstack/react-router'

import { settingsSections } from '~/core/settings/sections'
import type { CommandEntry } from '~/modules/actions-center/types'

export const settingsCommands = (router: RegisteredRouter): CommandEntry[] =>
  settingsSections.map(({ icon, label, slug }, index) => ({
    action: () =>
      router.navigate({ params: { section: slug }, to: '/settings/$section' }),
    group: 'Application',
    icon,
    keywords: ['preferences', 'options'],
    order: 20,
    shortcut: index === 0 ? ',' : undefined,
    value: `${label} settings`,
  }))
