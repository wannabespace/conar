import { createLazyFileRoute } from '@tanstack/react-router'
import { SecurityCard } from './-components/security-card'
import { SessionsCard } from './-components/sessions-card'

export const Route = createLazyFileRoute('/account/settings/')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <>
      <h2 className="mb-6 text-2xl font-semibold tracking-tight">Settings</h2>
      <div className="space-y-4">
        <SecurityCard />
        <SessionsCard />
      </div>
    </>
  )
}
