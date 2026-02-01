import { Alert, AlertDescription } from '@conar/ui/components/alert'
import { Badge } from '@conar/ui/components/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@conar/ui/components/card'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Separator } from '@conar/ui/components/separator'
import { useQuery } from '@tanstack/react-query'
import { createLazyFileRoute } from '@tanstack/react-router'
import { authClient } from '~/lib/auth'
import { TwoFactorSettings } from './-components/two-factor-settings'

export const Route = createLazyFileRoute('/account/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { data: session, isPending: isSessionLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data, error } = await authClient.getSession()
      if (error) {
        throw error
      }

      return data
    },
  })

  const { data: accounts, isPending: isAccountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await authClient.listAccounts()
      if (error) {
        throw error
      }

      return data
    },
  })

  const hasCredentialAccount = accounts?.some(account => account.providerId === 'credential')
  const twoFactorEnabled = session?.user?.twoFactorEnabled ?? false

  if (isSessionLoading || isAccountsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Two-factor authentication and sign-in</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingContent loading>Loading...</LoadingContent>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>
          Two-factor authentication (2FA) adds a code from your authenticator app at sign-in. Available for email/password accounts only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center gap-2 text-lg">
            <span className="font-medium">Two-factor authentication</span>
            {twoFactorEnabled ? <Badge variant="default">On</Badge> : <Badge variant="secondary">Off</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {twoFactorEnabled ? 'A code is required when you sign in.' : 'Turn on to require an authenticator code at sign-in.'}
          </p>
        </div>

        {!hasCredentialAccount && (
          <Alert>
            <AlertDescription>2FA is only available for accounts that sign in with email and password.</AlertDescription>
          </Alert>
        )}

        {hasCredentialAccount && (
          <>
            <Separator />
            <TwoFactorSettings enabled={twoFactorEnabled} />
          </>
        )}
      </CardContent>
    </Card>
  )
}
