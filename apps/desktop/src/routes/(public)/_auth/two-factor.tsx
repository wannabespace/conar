import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)/_auth/two-factor')({
  component: TwoFactorPage,
})

function TwoFactorPage() {
  return <div>Hello "/(public)/_auth/two-factor"!</div>
}
