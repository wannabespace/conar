import { useMutation } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'

import { TotpCodeInput } from '~/components/totp-code-input'
import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

import { useFinishSignIn } from './-lib/sign-in'

const TwoFactorPage = () => {
  const finishSignIn = useFinishSignIn()
  const [code, setCode] = useState('')

  const { mutate: verifyTotp, isPending } = useMutation({
    mutationFn: async (totpCode: string) => {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: totpCode,
      })

      if (error) {
        throw error
      }
    },
    onSuccess: () => finishSignIn(),
    onError: handleError,
  })

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Two-factor authentication
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter the code from your authenticator app.
        </p>
      </div>
      <TotpCodeInput
        label="Verification code"
        value={code}
        onChange={(value) => setCode(value)}
        onComplete={() => verifyTotp(code)}
        disabled={isPending}
        autoFocus
      />
    </div>
  )
}

export const Route = createFileRoute('/_auth/two-factor')({
  component: TwoFactorPage,
  loader: async () => {
    const { data: session } = await authClient.getSession()

    if (session?.user) {
      throw redirect({ to: '/account' })
    }
  },
})
