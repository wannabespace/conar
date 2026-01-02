import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/account/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_account/account/settings"!</div>
}
