import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/about')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className="p-2">Hello from About!</div>
}
