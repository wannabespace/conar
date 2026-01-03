import { createFileRoute } from '@tanstack/react-router'
import { type } from 'arktype'
import { Subscription } from './-components/subscription'

export const Route = createFileRoute('/account/')({
  validateSearch: type({
    'subscription?': '"success" | "cancel"',
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Subscription />
  )
}
