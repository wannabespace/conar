import { Button } from '@tamery/ui/components/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@tamery/ui/components/card'
import { copy } from '@tamery/ui/lib/copy'
import {
  createFileRoute,
  getRouteApi,
  Link,
  redirect,
} from '@tanstack/react-router'
import { type } from 'arktype'
import { useEffect, useEffectEvent } from 'react'

import { authClient } from '~/lib/auth'

const openRouteApi = getRouteApi('/open')

const getOpenMessage = (clientType: 'web' | 'desktop' | 'cli' | undefined) => {
  if (clientType === 'cli') {
    return 'You can close this tab and return to the Tamery CLI.'
  }
  if (clientType === 'desktop') {
    return 'You can open the desktop app and leave this page.'
  }
  return 'You can continue in Tamery or close this page.'
}

const getUrl = (token: string, codeChallenge: string, newUser?: boolean) =>
  `tamery://session?code-challenge=${codeChallenge}&token=${token}${newUser ? '&new-user=true' : ''}`

const handleCopyUrl = (
  token: string,
  codeChallenge: string,
  newUser?: boolean
) => {
  copy(getUrl(token, codeChallenge, newUser), 'URL copied to clipboard')
}

const OpenPageContent = () => {
  const { data } = authClient.useSession()
  const { type: clientType } = openRouteApi.useSearch()

  useEffect(() => {
    if (clientType === 'desktop') {
      location.assign('tamery://')
    }
  }, [clientType])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Opening Tamery</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p>{getOpenMessage(clientType)}</p>
          <div className="flex">
            {data ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                render={<Link to="/account" />}
              >
                Go to Account
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                render={<Link to="/sign-in" />}
              >
                Sign in
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const AuthPendingCard = () => (
  <>
    <CardHeader>
      <CardTitle>Authentication</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground animate-pulse">
        Loading authentication data...
      </p>
    </CardContent>
  </>
)

const AuthSuccessCard = ({
  codeChallenge,
  newUser,
  token,
}: {
  codeChallenge: string
  newUser?: boolean
  token: string
}) => (
  <>
    <CardHeader>
      <CardTitle>Authentication successful</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-6">
      <p>
        You have successfully signed in. You can now close this tab and return
        to the Tamery desktop app.
      </p>
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          If the app didn&apos;t open automatically, use the button below to
          copy the connection URL.
        </p>
        <div className="flex">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopyUrl(token, codeChallenge, newUser)}
            className="w-full"
          >
            Copy auth URL
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          Paste this URL in the desktop app to continue.
        </p>
      </div>
    </CardContent>
  </>
)

const AuthFailedCard = () => (
  <>
    <CardHeader>
      <CardTitle>Authentication failed</CardTitle>
    </CardHeader>
    <CardContent>
      Your session has expired or is invalid. Please sign in again to continue.
    </CardContent>
  </>
)

const OpenPage = () => {
  const { 'code-challenge': codeChallenge, 'new-user': newUser } =
    openRouteApi.useSearch()
  const { data, isPending } = authClient.useSession()

  const getUrlEvent = useEffectEvent(getUrl)

  useEffect(() => {
    if (isPending || !data || !codeChallenge) {
      return
    }

    location.assign(getUrlEvent(data.session.token, codeChallenge, newUser))
  }, [isPending, codeChallenge, data, newUser])

  if (!codeChallenge) {
    return <OpenPageContent />
  }

  let authCard = <AuthFailedCard />
  if (isPending) {
    authCard = <AuthPendingCard />
  } else if (data) {
    authCard = (
      <AuthSuccessCard
        codeChallenge={codeChallenge}
        newUser={newUser}
        token={data.session.token}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">{authCard}</Card>
    </div>
  )
}

export const Route = createFileRoute('/open')({
  component: OpenPage,
  validateSearch: type({
    'code-challenge?': 'string',
    'new-user?': 'boolean',
    'type?': '"web" | "desktop" | "cli"',
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const { type: clientType } = deps

    const { data } = await authClient.getSession()

    if (clientType === 'web' && data?.user) {
      const webUrl = import.meta.env.VITE_PUBLIC_WEB_URL
      if (typeof webUrl !== 'string' || webUrl.length === 0) {
        throw new Error('VITE_PUBLIC_WEB_URL is not configured')
      }
      throw redirect({ href: webUrl })
    }
  },
})
