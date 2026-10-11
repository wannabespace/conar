import {
  SettingsGroup,
  SettingsRow,
} from '@tamery/ui/components/custom/settings-group'
import { Switch } from '@tamery/ui/components/switch'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

import { DisableTfaDialog } from './disable-tfa-dialog'
import type { TotpSetup } from './enable-tfa-dialog'
import { EnableTfaDialog } from './enable-tfa-dialog'

const NO_SETUP: TotpSetup = { backupCodes: [], totpURI: '' }

export const SecuritySettings = () => {
  const { data } = authClient.useSession()
  const twoFactorEnabled = data?.user?.twoFactorEnabled ?? false

  const [enableOpen, setEnableOpen] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)

  const {
    mutate: enable,
    isPending: isEnabling,
    data: setup = NO_SETUP,
  } = useMutation({
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
