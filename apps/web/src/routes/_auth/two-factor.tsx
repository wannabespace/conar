import { SafeURL } from '@conar/shared/utils/safe-url'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { type } from 'arktype'
import { getSessionIsomorphic, isTwoFactorPendingIsomorphic } from '~/lib/auth'
import { TwoFactorVerify } from './-components/two-factor-verify'

export const Route = createFileRoute('/_auth/two-factor')({
  component: TwoFactorPage,
  validateSearch: type({
    'redirectPath?': 'string',
  }),
  beforeLoad: async ({ search: { redirectPath } }) => {
    const [{ data: session }, isTwoFactorPending] = await Promise.all([
      getSessionIsomorphic(),
      isTwoFactorPendingIsomorphic(),
    ])

    if (session?.user) {
      throw redirect({ to: '/account' })
    }

    if (!isTwoFactorPending) {
      throw redirect({ to: '/sign-in', search: redirectPath ? { redirectPath } : {} })
    }
  },
})

function TwoFactorPage() {
  const router = useRouter()
  const { redirectPath } = Route.useSearch()

  const onVerified = async () => {
    if (redirectPath) {
      const url = new SafeURL(location.origin + redirectPath)
      const path = url.pathname + url.search
      const to = path.startsWith('/') && !path.startsWith('//') ? path : '/account'
      await router.navigate({ to })
    }
    else {
      await router.navigate({ to: '/account' })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Two-factor authentication
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code from your authenticator app to complete sign-in.
        </p>
      </div>
      <TwoFactorVerify onSuccess={onVerified} />
    </div>
  )
}
