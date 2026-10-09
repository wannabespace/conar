import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@tamery/ui/components/card'
import { Label } from '@tamery/ui/components/label'
import { Switch } from '@tamery/ui/components/switch'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

import { DisableTfaDialog } from './disable-tfa-dialog'
import { EnableTfaDialog } from './enable-tfa-dialog'

export const SecurityCard = () => {
  const { data } = authClient.useSession()
  const twoFactorEnabled = data?.user?.twoFactorEnabled ?? false

  const [enableOpen, setEnableOpen] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)

  const {
    mutate: enable,
    isPending: isEnabling,
    data: totpURI = '',
  } = useMutation({
    mutationFn: async () => {
      const result = await authClient.twoFactor.enable({
        fetchOptions: { throw: true },
      })

      return result.method === 'totp' ? result.totpURI : ''
    },
    onError: handleError,
    onSuccess: () => setEnableOpen(true),
  })

  return (
    <>
      <EnableTfaDialog
        open={enableOpen}
        onOpenChange={setEnableOpen}
        totpURI={totpURI}
      />
      <DisableTfaDialog open={disableOpen} onOpenChange={setDisableOpen} />
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="flex items-center justify-between">
            <div>
              <span className="text-base font-medium">
                Two-factor authentication
              </span>
              <p className="text-muted-foreground text-xs">
                {twoFactorEnabled
                  ? 'A code for your authenticator app is required when you sign in.'
                  : 'Turn on to require an authenticator code at sign-in.'}
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={() =>
                twoFactorEnabled ? setDisableOpen(true) : enable()
              }
              disabled={isEnabling}
            />
          </Label>
        </CardContent>
      </Card>
    </>
  )
}
