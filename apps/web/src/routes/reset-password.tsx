import { Button } from '@conar/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@conar/ui/components/card'
import { createFileRoute } from '@tanstack/react-router'
import { type } from 'arktype'
import { useEffect, useEffectEvent } from 'react'

export const Route = createFileRoute('/reset-password')({
  component: RouteComponent,
  validateSearch: type({
    token: 'string',
  }),
})

function RouteComponent() {
  const { token } = Route.useSearch()

  const openApp = () => {
    location.assign(`conar://reset-password?token=${encodeURIComponent(token)}`)
  }

  const openAppEvent = useEffectEvent(openApp)

  useEffect(() => {
    openAppEvent()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>
            Reset your password
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p>
            Click the button below to open the Conar desktop app and reset your password.
          </p>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Button
                onClick={openApp}
                className="w-full"
              >
                Open Conar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              If the app didn't open automatically, click the button above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
