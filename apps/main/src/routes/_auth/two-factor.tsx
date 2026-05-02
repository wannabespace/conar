import { useMutation } from '@tanstack/react-query'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { TotpCodeInput } from '~/components/totp-code-input'
import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

export const Route = createFileRoute('/_auth/two-factor')({
  component: TwoFactorPage,
  loader: async () => {
    const { data: session } = await authClient.getSession()

    if (session?.user) {
      throw redirect({ to: '/account' })
    }
  },
})

// eslint-disable-next-line react-refresh/only-export-components
function TwoFactorPage() {
  const router = useRouter()
  const search = Route.useSearch()
  const [code, setCode] = useState('')

  const { mutate: verifyTotp, isPending } = useMutation({
    mutationFn: async (code: string) => {
      const { error } = await authClient.twoFactor.verifyTotp({ code })

      if (error) {
        throw error
      }
    },
    onSuccess: async () => {
      if (search.redirectPath) {
        const url = new URL(location.origin + search.redirectPath)

        await router.navigate({ to: url.pathname + url.search })
      }
      else {
        await router.navigate({ to: '/account' })
      }
    },
    onError: handleError,
  })

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Two-factor authentication
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the code from your authenticator app.
        </p>
      </div>
      <TotpCodeInput
        label="Verification code"
        value={code}
        onChange={value => setCode(value)}
        onComplete={() => verifyTotp(code)}
        disabled={isPending}
        autoFocus
      />
    </div>
  )
}
