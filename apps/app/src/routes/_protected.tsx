import { createFileRoute, Outlet } from '@tanstack/react-router'
import { SubscriptionModal } from '~/components/subscriprion-modal'
import { authClient } from '~/lib/auth'
import { ActionsCenter } from './-components/actions-center'

export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
})

// eslint-disable-next-line react-refresh/only-export-components
function ProtectedLayout() {
  const { data } = authClient.useSession()

  const hasUser = !!data?.user

  return (
    <>
      {hasUser && <SubscriptionModal />}
      <ActionsCenter />
      <Outlet />
    </>
  )
}
