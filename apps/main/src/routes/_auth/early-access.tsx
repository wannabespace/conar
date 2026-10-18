import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

import { posthog } from '~/lib/posthog'

const EarlyAccessPage = () => {
  useEffect(() => {
    void posthog.capture('early_access_joined')
  }, [])

  return (
    <div className="flex flex-col gap-2 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        You&apos;re on the list
      </h1>
      <p className="text-muted-foreground text-sm">
        Tamery is in early access. We&apos;ll email you when your account is
        ready.
      </p>
    </div>
  )
}

export const Route = createFileRoute('/_auth/early-access')({
  component: EarlyAccessPage,
})
