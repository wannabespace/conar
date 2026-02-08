import { Card, CardHeader, CardPanel, CardTitle } from '@conar/ui/components/card'
import { Label } from '@conar/ui/components/label'
import { Switch } from '@conar/ui/components/switch'
import { RiInformationLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '~/lib/auth'
import { DisableTfaDialog } from './-components/disable-tfa-dialog'
import { EnableTfaDialog } from './-components/enable-tfa-dialog'

export const Route = createLazyFileRoute('/account/settings/')({
  component: SettingsPage,
})

function SettingsPage() {
  const { data } = authClient.useSession()
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => authClient.listAccounts(),
  })

  const hasCredentialAccount = accounts?.data?.some(account => account.providerId === 'credential')
  const twoFactorEnabled = data?.user?.twoFactorEnabled ?? false

  const [enableOpen, setEnableOpen] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)

  return (
    <>
      <h2 className="mb-6 text-2xl font-semibold tracking-tight">Settings</h2>
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardPanel>
          <Label className="flex items-center justify-between">
            <div>
              <span className="text-base font-medium">Two-factor authentication</span>
              <p className="text-xs text-muted-foreground">
                {twoFactorEnabled
                  ? 'A code for your authenticator app is required when you sign in.'
                  : hasCredentialAccount
                    ? 'Turn on to require an authenticator code at sign-in.'
                    : (
                        <span className="flex items-center gap-1">
                          <RiInformationLine className="size-4" />
                          2FA is only available for accounts that can sign in with email and password.
                        </span>
                      )}
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={() => twoFactorEnabled ? setDisableOpen(true) : setEnableOpen(true)}
              disabled={!hasCredentialAccount}
            />
          </Label>
        </CardPanel>
      </Card>
      <EnableTfaDialog open={enableOpen} onOpenChange={setEnableOpen} />
      <DisableTfaDialog open={disableOpen} onOpenChange={setDisableOpen} />
    </>
  )
}
