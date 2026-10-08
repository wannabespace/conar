import { Ctrl } from '@tamery/ui/components/custom/shortcuts'
import { Switch } from '@tamery/ui/components/switch'
import { shortcutRevealStore } from '@tamery/ui/hooks/use-shortcut-reveal'
import { createFileRoute } from '@tanstack/react-router'
import { useSubscription } from 'seitu/react'

import { SettingsGroup, SettingsRow } from '~/core/settings/settings-group'
import { posthog } from '~/lib/posthog'

const GeneralSettings = () => {
  const isShortcutRevealOn = useSubscription(shortcutRevealStore)

  return (
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
            posthog.capture('shortcut_reveal_toggled', { enabled })
          }}
        />
      </SettingsRow>
    </SettingsGroup>
  )
}

export const Route = createFileRoute('/_protected/settings/general')({
  component: GeneralSettings,
})
