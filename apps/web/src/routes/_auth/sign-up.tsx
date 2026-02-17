import { createFileRoute, redirect } from '@tanstack/react-router'
import { type } from 'arktype'
import { getSessionIsomorphic } from '~/lib/auth'
import { AuthForm } from './-components/auth-form'

export const Route = createFileRoute('/_auth/sign-up')({
  component: SignUpPage,
  validateSearch: type({
    'redirectPath?': 'string',
  }),
  loader: async () => {
    const { data } = await getSessionIsomorphic()

    if (data?.user) {
      throw redirect({ to: '/account' })
    }
  },
})

function SignUpPage() {
  const { redirectPath } = Route.useSearch()
  return <AuthForm type="sign-up" redirectPath={redirectPath} />
}
