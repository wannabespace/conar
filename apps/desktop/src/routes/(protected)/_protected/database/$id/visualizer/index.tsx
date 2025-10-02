import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/visualizer/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(protected)/_protected/database/$id/visualizer/"!</div>
}
