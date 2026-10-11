import { Button } from '@tamery/ui/components/button'
import { Spinner } from '@tamery/ui/components/spinner'
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

import { OpenStatus } from '../open-status'

const { useSearch } = getRouteApi('/open')

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

const OpenPageContent = () => {
  const { data } = authClient.useSession()
  const { type: clientType } = useSearch()

  useEffect(() => {
    if (clientType === 'desktop') {
      location.assign('tamery://')
    }
  }, [clientType])

  return (
    <OpenStatus title="Opening Tamery" description={getOpenMessage(clientType)}>
      <Button
        variant="outline"
        render={data ? <Link to="/account" /> : <Link to="/sign-in" />}
      >
        {data ? 'Go to account' : 'Sign in'}
      </Button>
    </OpenStatus>
  )
}

const OpenPage = () => {
  const { 'code-challenge': codeChallenge, 'new-user': newUser } = useSearch()
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

  if (isPending) {
    return (
      <OpenStatus title="Signing you in" description="Checking your session.">
        <Spinner className="text-muted-foreground" />
      </OpenStatus>
    )
  }

  if (!data) {
    return (
      <OpenStatus
        title="Sign-in link expired"
        description="Your session has expired or is invalid. Sign in again to continue."
      >
        <Button variant="outline" render={<Link to="/sign-in" />}>
          Sign in
        </Button>
      </OpenStatus>
    )
  }

  return (
    <OpenStatus
      title="You're signed in"
      description="Return to the Tamery desktop app. If it didn't open, copy the sign-in link and paste it there."
    >
      <Button
        variant="outline"
        onClick={() =>
          copy(
            getUrl(data.session.token, codeChallenge, newUser),
            'Sign-in link copied'
          )
        }
      >
        Copy sign-in link
      </Button>
    </OpenStatus>
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
      throw redirect({ href: import.meta.env.VITE_PUBLIC_WEB_URL })
    }
  },
})
