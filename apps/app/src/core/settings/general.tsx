import {
  SettingsGroup,
  SettingsRow,
} from '@tamery/ui/components/custom/settings-group'
import { Switch } from '@tamery/ui/components/switch'
import { isLinux } from '@tamery/ui/lib/os'
import { useSubscription } from 'seitu/react'

import { analyticsStore } from '~/lib/posthog'
import { ConnectionLinksRow } from '~/modules/connection-links/connection-links-settings'

import { ElectronSwitchRow } from './electron-switch-row'

const hasStartAtLogin = !!window.electron && !isLinux

export const GeneralSettings = () => {
  const isAnalyticsOn = useSubscription(analyticsStore)

  return (
    <SettingsGroup>
      {hasStartAtLogin && (
        <ElectronSwitchRow
          id="open-at-login"
          title="Start at login"
          description="Opens Tamery when you log in to this computer."
          event="open_at_login_toggled"
          get={() => window.electron?.openAtLogin.get()}
          set={(enabled) => window.electron?.openAtLogin.set(enabled)}
        />
      )}
      {window.electron && <ConnectionLinksRow />}
      <SettingsRow
        htmlFor="analytics"
        title="Share usage analytics"
        description="Sends anonymous usage events, error reports and session recordings, with your data masked, to PostHog."
      >
        <Switch
          id="analytics"
          size="sm"
          checked={isAnalyticsOn}
          onCheckedChange={(enabled) => analyticsStore.set(enabled)}
        />
      </SettingsRow>
    </SettingsGroup>
  )
}
