import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  )
}
