import { Button } from '@tamery/ui/components/button'
import { useMutation } from '@tanstack/react-query'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { TotpCodeInput } from '~/components/totp-code-input'
import { authClient, twoFactorRedirectSchema } from '~/lib/auth'
import { handleError } from '~/utils/error'

const { useSearch } = getRouteApi('/_auth')

export const sendSignInCode = (email: string) =>
  authClient.emailOtp.sendVerificationOtp({
    email,
    fetchOptions: { throw: true },
    type: 'sign-in',
  })

export const EmailCode = ({
  email,
  onBack,
}: {
  email: string
  onBack: () => void
}) => {
  const router = useRouter()
  const search = useSearch()
  const [code, setCode] = useState('')

  const { mutate: resend, isPending: isResending } = useMutation({
    mutationFn: () => sendSignInCode(email),
    onSuccess: () => toast.success('We sent you a new code.'),
    onError: handleError,
  })

  const { mutate: verify, isPending } = useMutation({
    mutationFn: (otp: string) =>
      authClient.signIn.emailOtp({
        email,
        fetchOptions: { throw: true },
        otp,
      }),
    onSuccess: async (data) => {
      if (twoFactorRedirectSchema.allows(data)) {
        await router.navigate({ to: '/two-factor', search })
      } else if (search.redirectPath) {
        const url = new URL(location.origin + search.redirectPath)

        await router.navigate({ to: url.pathname + url.search })
      } else {
        await router.invalidate()
      }
    },
    onError: (error) => {
      setCode('')
      handleError(error)
    },
  })

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="text-muted-foreground text-sm">
          We sent a code to <span className="text-foreground">{email}</span>
        </p>
      </div>
      <TotpCodeInput
        label="Code"
        value={code}
        onChange={setCode}
        onComplete={(value: string) => verify(value)}
        disabled={isPending}
        autoFocus
      />
      <div className="flex gap-4">
        <Button variant="link-muted" size="xs" onClick={onBack}>
          Use a different email
        </Button>
        <Button
          variant="link-muted"
          size="xs"
          onClick={() => resend()}
          disabled={isResending}
        >
          Resend code
        </Button>
      </div>
    </div>
  )
}
