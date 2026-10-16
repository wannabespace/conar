import { Button } from '@tamery/ui/components/button'
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
import { posthog } from '~/lib/posthog'

import { OpenStatus } from '../open-status'

const { useLoaderData, useSearch } = getRouteApi('/open')

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
  const { token } = useLoaderData()
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
        render={token ? <Link to="/account" /> : <Link to="/sign-in" />}
      >
        {token ? 'Go to account' : 'Sign in'}
      </Button>
    </OpenStatus>
  )
}

const OpenPage = () => {
  const { 'code-challenge': codeChallenge, 'new-user': newUser } = useSearch()
  const { token } = useLoaderData()

  const getUrlEvent = useEffectEvent(getUrl)

  useEffect(() => {
    if (!token || !codeChallenge) {
      return
    }

    void posthog.capture('desktop_sign_in_handed_off', { newUser: !!newUser })
    location.assign(getUrlEvent(token, codeChallenge, newUser))
  }, [codeChallenge, token, newUser])

  if (!codeChallenge) {
    return <OpenPageContent />
  }

  if (!token) {
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
        onClick={() => {
          copy(getUrl(token, codeChallenge, newUser), 'Sign-in link copied')
          void posthog.capture('sign_in_link_copied')
        }}
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

    return { token: data?.session.token }
  },
})
