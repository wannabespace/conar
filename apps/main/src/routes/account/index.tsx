import { FavouriteIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@tamery/ui/components/alert'
import { Button } from '@tamery/ui/components/button'
import { createFileRoute, getRouteApi, useRouter } from '@tanstack/react-router'
import { type } from 'arktype'
import JSConfetti from 'js-confetti'
import { useEffect, useState } from 'react'

import { Subscription } from './-components/subscription'

const confetti = typeof window === 'undefined' ? null : new JSConfetti()
const { useSearch } = getRouteApi('/account/')

const DESKTOP_URL = 'tamery://'

const getReturnUrl = (clientType: 'web' | 'desktop' | 'cli' | undefined) => {
  if (clientType === 'desktop') {
    return DESKTOP_URL
  }
  if (clientType === 'web') {
    return import.meta.env.VITE_PUBLIC_WEB_URL
  }
  return null
}

const RouteComponent = () => {
  const { subscription, type: clientType } = useSearch()
  const router = useRouter()
  // oxlint-disable-next-line react/hook-use-state
  const [isSuccess] = useState(() => subscription === 'success')
  // oxlint-disable-next-line react/hook-use-state
  const [returnUrl] = useState(() => getReturnUrl(clientType))

  useEffect(() => {
    if (!isSuccess) {
      return
    }

    const timeout1 = setTimeout(() => {
      confetti?.addConfetti()
    }, 500)
    const timeout2 = returnUrl
      ? setTimeout(() => {
          location.assign(returnUrl)
        }, 2000)
      : undefined
    router.navigate({ to: '/account', replace: true })

    return () => {
      clearTimeout(timeout1)
      clearTimeout(timeout2)
    }
  }, [isSuccess, returnUrl, router])

  return (
    <>
      {isSuccess && (
        <Alert variant="success" className="mb-6">
          <AlertTitle className="flex items-center gap-2">
            <HugeiconsIcon
              icon={FavouriteIcon}
              strokeWidth={2}
              className="size-4"
            />
            Subscription upgraded successfully!
          </AlertTitle>
          <AlertDescription>
            Your subscription has been upgraded successfully.
          </AlertDescription>
          {!returnUrl && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-fit"
              render={<a href={DESKTOP_URL} aria-label="Open Tamery" />}
            >
              Open Tamery
            </Button>
          )}
        </Alert>
      )}
      <Subscription />
    </>
  )
}

export const Route = createFileRoute('/account/')({
  validateSearch: type({
    'subscription?': '"success" | "cancel"',
    'period?': '"monthly" | "yearly"',
    'type?': '"web" | "desktop" | "cli"',
  }),
  component: RouteComponent,
})
