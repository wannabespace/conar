import type { useRouter } from '@tanstack/react-router'

import { settingsSections } from '~/core/settings/sections'
import type { CommandEntry } from '~/lib/module'

export const settingsCommands = (
  router: ReturnType<typeof useRouter>
): CommandEntry[] =>
  settingsSections().map(({ icon, label, slug }, index) => ({
    action: () =>
      router.navigate({ params: { section: slug }, to: '/settings/$section' }),
    group: 'Application',
    icon,
    keywords: ['preferences', 'options'],
    order: 20,
    shortcut: index === 0 ? ',' : undefined,
    value: `${label} settings`,
  }))
