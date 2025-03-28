import { Card, CardContent, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { DotPattern } from '@connnect/ui/components/magicui/dot-pattern'
import { copy } from '@connnect/ui/lib/copy'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { z } from 'zod'
import { authClient } from '~/lib/auth'

export const Route = createFileRoute('/open')({
  component: RouteComponent,
  validateSearch: z.object({
    'code-challenge': z.string(),
    'new-user': z.boolean().optional(),
  }),
})

function RouteComponent() {
  const { 'code-challenge': codeChallenge, 'new-user': newUser } = Route.useSearch()
  const { data, isPending } = authClient.useSession()

  const getUrl = (token: string, codeChallenge: string) => `connnect://session?code-challenge=${codeChallenge}&token=${token}${newUser ? '&new-user=true' : ''}`

  function handleOpenSession(codeChallenge: string) {
    if (!data)
      return

    location.assign(getUrl(data.session.token, codeChallenge))
  }

  const handleCopyUrl = () => {
    if (!data)
      return

    copy(getUrl(data.session.token, codeChallenge))
  }

  useEffect(() => {
    if (isPending)
      return

    if (codeChallenge) {
      handleOpenSession(codeChallenge)
    }
  }, [isPending, codeChallenge])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        className="absolute z-10 top-0 left-0 [mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)]"
      />
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          {isPending
            ? (
                <p>Loading authentication data...</p>
              )
            : data
              ? (
                  <>
                    <p className="mb-4">
                      If the app didn't open automatically, copy the URL below and paste it in the desktop app.
                    </p>
                    <div className="flex justify-center">
                      <button
                        type="button"
                        className="text-xs text-primary cursor-pointer hover:underline"
                        onClick={handleCopyUrl}
                      >
                        Click here to copy the URL
                      </button>
                    </div>
                  </>
                )
              : (
                  <p className="mb-4">
                    Your session has expired or is invalid. Please sign in again to continue.
                  </p>
                )}
        </CardContent>
      </Card>
    </div>
  )
}
