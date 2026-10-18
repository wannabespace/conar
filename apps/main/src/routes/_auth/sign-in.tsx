import { EARLY_ACCESS_ERROR_CODE } from '@tamery/shared/constants'
import { Alert, AlertTitle } from '@tamery/ui/components/alert'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { type } from 'arktype'

import { authClient } from '~/lib/auth'

import { AuthForm } from './-components/auth-form'

const SignInPage = () => {
  const { error } = Route.useSearch()

  return (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Sign-in didn&apos;t go through. Try again.</AlertTitle>
        </Alert>
      )}
      <AuthForm />
    </>
  )
}

export const Route = createFileRoute('/_auth/sign-in')({
  component: SignInPage,
  validateSearch: type({
    'error?': 'string',
  }),
  beforeLoad: ({ search }) => {
    if (search.error === EARLY_ACCESS_ERROR_CODE) {
      throw redirect({ to: '/early-access' })
    }
  },
  loader: async () => {
    const { data } = await authClient.getSession()

    if (data?.user) {
      throw redirect({ to: '/account' })
    }
  },
})
