import { Switch } from '@tamery/ui/components/switch'
import { createFileRoute } from '@tanstack/react-router'
import { useSubscription } from 'seitu/react'

import { SettingsGroup, SettingsRow } from '~/core/settings/settings-group'
import { analyticsStore } from '~/lib/posthog'

const PrivacySettings = () => {
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

export const Route = createFileRoute('/_protected/settings/privacy')({
  component: PrivacySettings,
})
