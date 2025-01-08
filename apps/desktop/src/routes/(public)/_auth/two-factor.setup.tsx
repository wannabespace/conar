import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)/_auth/two-factor/setup')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(public)/_auth/two-factor/setup"!</div>
}
