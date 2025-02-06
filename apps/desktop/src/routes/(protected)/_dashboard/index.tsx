import { createFileRoute, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/(protected)/_dashboard/')({
  component: HomeComponent,
})

function HomeComponent() {
  const router = useRouter()

  return (
    <div>
      <h3>Welcome Home!</h3>
      <button type="button" onClick={() => router.navigate({ to: '/databases' })}>
        Go to databases
      </button>
    </div>
  )
}
