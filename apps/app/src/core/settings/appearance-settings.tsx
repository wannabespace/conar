import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import type { Theme } from '@tamery/ui/theme-store'
import { themeStore, useTheme } from '@tamery/ui/theme-store'

import { posthog } from '~/lib/posthog'

import { SettingsGroup, SettingsRow } from './settings-group'

const THEMES: { label: string; value: Theme }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]

export const AppearanceSettings = () => {
  const theme = useTheme()

  return (
    <SettingsGroup>
      <SettingsRow
        title="Theme"
        description="Follow the system appearance or keep Tamery light or dark."
      >
        <Select
          items={THEMES}
          value={theme}
          onValueChange={(next) => {
            if (next) {
              themeStore.set(next)
              void posthog.capture('theme_changed', { theme: next })
            }
          }}
        >
          <SelectTrigger size="sm" aria-label="Theme" className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent size="sm">
            {THEMES.map(({ label, value }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingsRow>
    </SettingsGroup>
  )
}
