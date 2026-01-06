import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/account/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_account/account/settings"!</div>
}
