import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@tamery/ui/components/card'
import { Label } from '@tamery/ui/components/label'
import { Switch } from '@tamery/ui/components/switch'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { authClient } from '~/lib/auth'

import { DisableTfaDialog } from './disable-tfa-dialog'
import { EnableTfaDialog } from './enable-tfa-dialog'

export const SecurityCard = () => {
  const { data } = authClient.useSession()
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => authClient.listAccounts(),
  })

  const hasCredentialAccount = accounts?.data?.some(
    (account) => account.providerId === 'credential'
  )
  const twoFactorEnabled = data?.user?.twoFactorEnabled ?? false

  const [enableOpen, setEnableOpen] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)

  return (
    <>
      <EnableTfaDialog open={enableOpen} onOpenChange={setEnableOpen} />
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
                {(() => {
                  if (twoFactorEnabled) {
                    return 'A code for your authenticator app is required when you sign in.'
                  }
                  if (hasCredentialAccount) {
                    return 'Turn on to require an authenticator code at sign-in.'
                  }
                  return (
                    <span className="flex items-center gap-1">
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                        strokeWidth={2}
                        className="size-4"
                      />
                      2FA is only available for accounts that can sign in with
                      email and password.
                    </span>
                  )
                })()}
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={() =>
                twoFactorEnabled ? setDisableOpen(true) : setEnableOpen(true)
              }
              disabled={!hasCredentialAccount}
            />
          </Label>
        </CardContent>
      </Card>
    </>
  )
}
