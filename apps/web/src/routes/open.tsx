import { Button } from '@conar/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@conar/ui/components/card'
import { copy } from '@conar/ui/lib/copy'
import { createFileRoute } from '@tanstack/react-router'
import { type } from 'arktype'
import { useCallback, useEffect } from 'react'
import { authClient } from '~/lib/auth'

export const Route = createFileRoute('/open')({
  component: OpenPage,
  validateSearch: type({
    'code-challenge': 'string',
    'new-user?': 'boolean',
    'connnect?': 'boolean',
  }),
})

function OpenPage() {
  const { 'code-challenge': codeChallenge, 'new-user': newUser, connnect } = Route.useSearch()
  const { data, isPending } = authClient.useSession()

  const getUrl = useCallback((token: string, codeChallenge: string) => `${connnect ? 'connnect' : 'conar'}://session?code-challenge=${codeChallenge}&token=${token}${newUser ? '&new-user=true' : ''}`, [connnect, newUser])

  const handleOpenSession = useCallback((codeChallenge: string) => {
    if (!data)
      return

    location.assign(getUrl(data.session.token, codeChallenge))
  }, [data, getUrl])

  const handleCopyUrl = () => {
    if (!data)
      return

    copy(getUrl(data.session.token, codeChallenge), 'URL copied to clipboard')
  }

  useEffect(() => {
    if (isPending)
      return

    if (codeChallenge) {
      handleOpenSession(codeChallenge)
    }
  }, [isPending, codeChallenge, handleOpenSession])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        {isPending
          ? (
              <>
                <CardHeader>
                  <CardTitle>
                    Authentication
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground animate-pulse">Loading authentication data...</p>
                </CardContent>
              </>
            )
          : data
            ? (
                <>
                  <CardHeader>
                    <CardTitle>
                      Authentication successful
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-6">
                    <p>
                      You have successfully signed in. You can now close this tab and return to the Conar desktop app.
                    </p>
                    <div className="flex flex-col gap-4">
                      <p className="text-muted-foreground text-sm">
                        If the app didn't open automatically, use the button below to copy the connection URL.
                      </p>
                      <div className="flex">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyUrl}
                          className="w-full"
                        >
                          Copy connection URL
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Paste this URL in the desktop app to continue.
                      </p>
                    </div>
                  </CardContent>
                </>
              )
            : (
                <>
                  <CardHeader>
                    <CardTitle>
                      Authentication failed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    Your session has expired or is invalid. Please sign in again to continue.
                  </CardContent>
                </>
              )}
      </Card>
    </div>
  )
}
