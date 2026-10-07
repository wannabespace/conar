import { Ctrl } from '@tamery/ui/components/custom/shortcuts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { Switch } from '@tamery/ui/components/switch'
import { shortcutRevealStore } from '@tamery/ui/hooks/use-shortcut-reveal'
import type { Theme } from '@tamery/ui/theme-store'
import { themeStore, useTheme } from '@tamery/ui/theme-store'
import { useSubscription } from 'seitu/react'

import { posthog } from '~/lib/posthog'

import { SettingsGroup, SettingsRow } from './settings-group'

const THEMES: { label: string; value: Theme }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]

export const GeneralSettings = () => {
  const theme = useTheme()
  const isShortcutRevealOn = useSubscription(shortcutRevealStore)

  return (
    <>
      <SettingsGroup title="Appearance">
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
      <SettingsGroup title="Keyboard">
        <SettingsRow
          htmlFor="shortcut-reveal"
          title={
            <>
              Show shortcuts while holding
              <Ctrl userAgent={navigator.userAgent} />
            </>
          }
          description="Holding the key for a moment shows each control's shortcut on top of it."
        >
          <Switch
            id="shortcut-reveal"
            size="sm"
            checked={isShortcutRevealOn}
            onCheckedChange={(enabled) => {
              shortcutRevealStore.set(enabled)
              void posthog.capture('shortcut_reveal_toggled', { enabled })
            }}
          />
        </SettingsRow>
      </SettingsGroup>
    </>
  )
}
