import {
  SettingsGroup,
  SettingsRow,
} from '@tamery/ui/components/custom/settings-group'
import { Switch } from '@tamery/ui/components/switch'
import { useSubscription } from 'seitu/react'

import { analyticsStore } from '~/lib/posthog'

export const PrivacySettings = () => {
  const isAnalyticsOn = useSubscription(analyticsStore)

  return (
    <SettingsGroup>
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
