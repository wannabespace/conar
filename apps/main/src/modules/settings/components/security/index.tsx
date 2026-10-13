import {
  SettingsGroup,
  SettingsRow,
} from '@tamery/ui/components/custom/settings-group'
import { Switch } from '@tamery/ui/components/switch'
import { useMutation } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'

import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

import { DisableTfaDialog } from './disable-tfa-dialog'
import type { TotpSetup } from './enable-tfa-dialog'
import { EnableTfaDialog } from './enable-tfa-dialog'

const NO_SETUP: TotpSetup = { backupCodes: [], totpURI: '' }

const { useRouteContext } = getRouteApi('/account')

export const SecuritySettings = () => {
  const { user } = useRouteContext()
  const twoFactorEnabled = user.twoFactorEnabled ?? false

  const [enableOpen, setEnableOpen] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)

  const {
    mutate: enable,
    isPending: isEnabling,
    data: setup = NO_SETUP,
  } = useMutation({
    meta: { event: 'two_factor_setup_started' },
    mutationFn: async () => {
      const result = await authClient.twoFactor.enable({
        fetchOptions: { throw: true },
      })

      return result.method === 'totp' ? result : NO_SETUP
    },
    onError: handleError,
    onSuccess: () => setEnableOpen(true),
  })

  return (
    <>
      <EnableTfaDialog
        open={enableOpen}
        onOpenChange={setEnableOpen}
        setup={setup}
      />
      <DisableTfaDialog open={disableOpen} onOpenChange={setDisableOpen} />
      <SettingsGroup title="Security">
        <SettingsRow
          htmlFor="two-factor"
          title="Two-factor authentication"
          description={
            twoFactorEnabled
              ? 'Signing in asks for a code from your authenticator app.'
              : 'Ask for a code from an authenticator app when you sign in.'
          }
        >
          <Switch
            id="two-factor"
            size="sm"
            checked={twoFactorEnabled}
            onCheckedChange={() =>
              twoFactorEnabled ? setDisableOpen(true) : enable()
            }
            disabled={isEnabling}
          />
        </SettingsRow>
      </SettingsGroup>
    </>
  )
}
