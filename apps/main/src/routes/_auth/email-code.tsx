import { Button } from '@tamery/ui/components/button'
import { useMutation } from '@tanstack/react-query'
import {
  createFileRoute,
  getRouteApi,
  Link,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { type } from 'arktype'
import { useState } from 'react'
import { toast } from 'sonner'

import { TotpCodeInput } from '~/components/totp-code-input'
import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

import {
  sendSignInCode,
  twoFactorRedirectSchema,
  useFinishSignIn,
} from './-lib/sign-in'

const { useSearch } = getRouteApi('/_auth/email-code')

const EmailCodePage = () => {
  const router = useRouter()
  const { email, redirectPath } = useSearch()
  const finishSignIn = useFinishSignIn()
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
    onSuccess: (data) =>
      twoFactorRedirectSchema.allows(data)
        ? router.navigate({ to: '/two-factor', search: { redirectPath } })
        : finishSignIn(),
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
          We sent a code to{' '}
          <span data-mask className="text-foreground">
            {email}
          </span>
        </p>
      </div>
      <TotpCodeInput
        label="Code"
        value={code}
        onChange={setCode}
        onComplete={verify}
        disabled={isPending}
        autoFocus
      />
      <div className="flex gap-4">
        <Button
          variant="link-muted"
          size="xs"
          render={<Link to="/sign-in" search={{ redirectPath }} />}
        >
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

export const Route = createFileRoute('/_auth/email-code')({
  component: EmailCodePage,
  validateSearch: type({
    email: 'string.email',
  }),
  loader: async () => {
    const { data } = await authClient.getSession()

    if (data?.user) {
      throw redirect({ to: '/account' })
    }
  },
})
