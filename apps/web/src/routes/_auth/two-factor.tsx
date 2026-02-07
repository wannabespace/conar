import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { FieldGroup } from '@conar/ui/components/field'
import { useForm, useStore } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { type } from 'arktype'
import { toast } from 'sonner'
import { TotpCodeInput } from '~/components/totp-code-input'
import { authClient, getSessionIsomorphic, isTwoFactorPendingIsomorphic } from '~/lib/auth'
import { handleError } from '~/utils/error'

export const Route = createFileRoute('/_auth/two-factor')({
  component: TwoFactorPage,
  validateSearch: type({
    'redirectPath?': 'string',
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps: { redirectPath } }) => {
    const { data: session } = await getSessionIsomorphic()

    if (session?.user) {
      throw redirect({ to: '/account' })
    }

    const isTwoFactorPending = isTwoFactorPendingIsomorphic()

    if (!isTwoFactorPending) {
      throw redirect({ to: '/sign-in', search: redirectPath ? { redirectPath } : {} })
    }
  },
})

function TwoFactorPage() {
  const router = useRouter()
  const { redirectPath } = Route.useSearch()

  const { mutate: verifyTotp, isPending } = useMutation({
    mutationFn: async (code: string) => {
      const { error } = await authClient.twoFactor.verifyTotp({ code })

      if (error) {
        throw error
      }
    },
    onSuccess: async () => {
      toast.success('Verified')

      if (redirectPath) {
        const url = new URL(location.origin + redirectPath)
        const path = url.pathname + url.search
        const to = path.startsWith('/') && !path.startsWith('//') ? path : '/account'
        await router.navigate({ to })
      }
      else {
        await router.navigate({ to: '/account' })
      }
    },
    onError: handleError,
  })

  const form = useForm({
    defaultValues: {
      code: '',
    },
    onSubmit: ({ value }) => verifyTotp(value.code),
  })

  const canSubmit = useStore(form.store, state => state.canSubmit)

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
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <FieldGroup className="gap-4">
          <form.Field name="code">
            {field => (
              <TotpCodeInput
                value={field.state.value}
                onChange={value => field.handleChange(value)}
                disabled={isPending}
                autoFocus
              />
            )}
          </form.Field>
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !canSubmit}
          >
            <LoadingContent loading={isPending}>Verify</LoadingContent>
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}
