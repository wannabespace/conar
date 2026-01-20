import { Alert, AlertDescription, AlertTitle } from '@conar/ui/components/alert'
import { RiHeart3Fill } from '@remixicon/react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { type } from 'arktype'
import JSConfetti from 'js-confetti'
import { useEffect, useState } from 'react'
import { Subscription } from './-components/subscription'

export const Route = createFileRoute('/account/')({
  validateSearch: type({
    'subscription?': '"success" | "cancel"',
    'period?': '"monthly" | "yearly"',
  }),
  component: RouteComponent,
})

const confetti = typeof window !== 'undefined' ? new JSConfetti() : null

function RouteComponent() {
  const { subscription } = Route.useSearch()
  const router = useRouter()
  const [isSuccess] = useState(subscription === 'success')

  useEffect(() => {
    if (isSuccess) {
      const timeout1 = setTimeout(() => {
        confetti?.addConfetti()
      }, 500)
      const timeout2 = setTimeout(() => {
        location.assign('conar://')
      }, 2000)
      router.navigate({ to: '/account', replace: true })
      return () => {
        clearTimeout(timeout1)
        clearTimeout(timeout2)
      }
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
