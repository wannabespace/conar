import { Button } from '@conar/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@conar/ui/components/card'
import { copy } from '@conar/ui/lib/copy'
import { createFileRoute } from '@tanstack/react-router'
import { type } from 'arktype'
import { useEffect, useEffectEvent } from 'react'
import { authClient } from '~/lib/auth'

export const Route = createFileRoute('/open')({
  component: OpenPage,
  validateSearch: type({
    'code-challenge?': 'string',
    'new-user?': 'boolean',
  }),
})

const getUrl = (token: string, codeChallenge: string, newUser?: boolean) => `conar://session?code-challenge=${codeChallenge}&token=${token}${newUser ? '&new-user=true' : ''}`

function OpenPage() {
  const { 'code-challenge': codeChallenge, 'new-user': newUser } = Route.useSearch()
  const { data, isPending } = authClient.useSession()

  const handleOpenSession = useEffectEvent((codeChallenge: string) => {
    if (!data)
      return

    location.assign(getUrl(data.session.token, codeChallenge, newUser))
  })

  const handleCopyUrl = () => {
    if (!data || !codeChallenge)
      return

    copy(getUrl(data.session.token, codeChallenge), 'URL copied to clipboard')
  }

  useEffect(() => {
    if (isPending)
      return

    if (codeChallenge) {
      handleOpenSession(codeChallenge)
    }
  }, [isPending, codeChallenge])

  if (codeChallenge) {
    return (
      <div className={`
        flex min-h-screen flex-col items-center justify-center p-4
      `}
      >
        <Card className="w-full max-w-md">
          {isPending
            ? (
                <>
                  <CardHeader>
                    <CardTitle>
                      Authentication
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="animate-pulse text-muted-foreground">Loading authentication data...</p>
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
                        <p className="text-sm text-muted-foreground">
                          If the app didn't open automatically, use the button below to copy the connection URL.
                        </p>
                        <div className="flex">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyUrl}
                            className="w-full"
                          >
                            Copy auth URL
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            Opening the app
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p>
            This page is now opening the app. You can safely close this tab.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
