import { Alert, AlertDescription, AlertTitle } from '@conar/ui/components/alert'
import { Button } from '@conar/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@conar/ui/components/card'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { RiAlertLine, RiDeleteBinLine } from '@remixicon/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createLazyFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

export const Route = createLazyFileRoute('/account/delete')({
  component: DeleteAccountPage,
})

// eslint-disable-next-line react-refresh/only-export-components
function DeleteAccountPage() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => authClient.listAccounts(),
  })

  const hasCredentialAccount = accounts?.data?.some(account => account.providerId === 'credential')

  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const options: { password?: string; callbackURL?: string } = {
        callbackURL: '/sign-in',
      }

      if (hasCredentialAccount && password) {
        options.password = password
      }

      const { error } = await authClient.deleteUser(options)

      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      toast.success('Account deleted successfully')
      router.navigate({ to: '/sign-in' })
    },
    onError: handleError,
  })

  const isConfirmed = confirmation === 'DELETE'
  const canSubmit = isConfirmed && (!hasCredentialAccount || password.length > 0)

  return (
    <>
      <h2 className="mb-6 text-2xl font-semibold tracking-tight">Delete Account</h2>

      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle className="flex items-center gap-2">
            <RiAlertLine className="size-4" />
            Danger Zone
          </AlertTitle>
          <AlertDescription>
            Deleting your account is permanent and cannot be undone. All your data,
            including your subscription, settings, and sessions will be permanently removed.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Permanently delete account</CardTitle>
            <CardDescription>
              Once you delete your account, there is no going back.
              {session?.user?.email && (
                <>
                  {' '}
                  You are currently signed in as
                  {' '}
                  <span className="font-medium text-foreground">{session.user.email}</span>
                  .
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                mutate()
              }}
            >
              {hasCredentialAccount && (
                <div className="space-y-2">
                  <Label htmlFor="delete-password">Password</Label>
                  <Input
                    id="delete-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={isPending}
                    autoComplete="current-password"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="delete-confirmation">
                  Type
                  {' '}
                  <span className="font-mono font-semibold">DELETE</span>
                  {' '}
                  to confirm
                </Label>
                <Input
                  id="delete-confirmation"
                  type="text"
                  placeholder="DELETE"
                  value={confirmation}
                  onChange={e => setConfirmation(e.target.value)}
                  disabled={isPending}
                  autoComplete="off"
                />
              </div>

              <Button
                type="submit"
                variant="destructive"
                disabled={!canSubmit || isPending}
                className="w-full"
              >
                <LoadingContent loading={isPending}>
                  <RiDeleteBinLine className="size-4" />
                  Permanently delete my account
                </LoadingContent>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
