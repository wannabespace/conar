import { RiHeart3Fill } from '@remixicon/react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@tamery/ui/components/alert'
import { createFileRoute, getRouteApi, useRouter } from '@tanstack/react-router'
import { type } from 'arktype'
import JSConfetti from 'js-confetti'
import { useEffect, useState } from 'react'

import { Subscription } from './-components/subscription'

const confetti = typeof window === 'undefined' ? null : new JSConfetti()
const accountRouteApi = getRouteApi('/account/')

const RouteComponent = () => {
  const { subscription } = accountRouteApi.useSearch()
  const router = useRouter()
  const [isSuccess, setIsSuccess] = useState(() => subscription === 'success')
  void setIsSuccess

  useEffect(() => {
    if (!isSuccess) {
      return
    }

    const timeout1 = setTimeout(() => {
      confetti?.addConfetti()
    }, 500)
    const timeout2 = setTimeout(() => {
      location.assign('tamery://')
    }, 2000)
    router.navigate({ to: '/account', replace: true })

    return () => {
      clearTimeout(timeout1)
      clearTimeout(timeout2)
    }
  }, [isSuccess, router])

  return (
    <>
      {isSuccess && (
        <Alert variant="success" className="mb-6">
          <AlertTitle className="flex items-center gap-2">
            <RiHeart3Fill className="size-4" />
            Subscription upgraded successfully!
          </AlertTitle>
          <AlertDescription>
            Your subscription has been upgraded successfully.
          </AlertDescription>
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
  }),
  component: RouteComponent,
})
