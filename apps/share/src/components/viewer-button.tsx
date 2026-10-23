import { Button } from '@tamery/ui/components/button'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useLocation } from '@tanstack/react-router'

import { viewerQueryOptions } from '~/lib/account'
import { posthog } from '~/lib/posthog'

export const ViewerButton = () => {
  const { data: viewer } = useSuspenseQuery(viewerQueryOptions)
  const here = useLocation({ select: (location) => location.href })

  if (viewer) {
    return (
      here !== '/' && (
        <Button size="sm" variant="ghost-muted" render={<Link to="/" />}>
          Your shares
        </Button>
      )
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      render={
        <a
          href={`${import.meta.env.VITE_PUBLIC_MAIN_URL}/deep/share?${new URLSearchParams({ path: here })}`}
          aria-label="Sign in"
        />
      }
      onClick={() => {
        void posthog.capture('share_sign_in_started')
      }}
    >
      Sign in
    </Button>
  )
}
