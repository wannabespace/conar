import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/_protected/')({
  component: HomeComponent,
})

function HomeComponent() {
  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
    </div>
  )
}
