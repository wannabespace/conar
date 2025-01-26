import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(protected)/_dashboard/databases/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>some id</div>
}
