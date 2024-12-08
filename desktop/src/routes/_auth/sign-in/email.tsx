import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/sign-in/email')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_auth/sign-in/email"!</div>
}
