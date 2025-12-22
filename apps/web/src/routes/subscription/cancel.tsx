import { Card, CardContent, CardHeader, CardTitle } from '@conar/ui/components/card'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/subscription/cancel')({
  component: RouteComponent,
})

function RouteComponent() {
  useEffect(() => {
    location.assign('conar://subscription/cancel')
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>
            Subscription cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p>
            Your subscription has been cancelled. You can now close this tab and return to the Conar desktop app.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
