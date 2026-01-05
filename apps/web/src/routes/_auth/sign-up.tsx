import { createFileRoute, redirect } from '@tanstack/react-router'
import { type } from 'arktype'
import { getSessionIsomorphic } from '~/lib/auth'
import { AuthForm } from './-components/auth-form'

export const Route = createFileRoute('/_auth/sign-up')({
  component: SignUpPage,
  validateSearch: type({
    'redirectTo?': 'string',
  }),
  loaderDeps: ({ search }) => search,
  loader: async () => {
    const { data } = await getSessionIsomorphic()

    if (data?.user) {
      throw redirect({ to: '/account' })
    }
  },
})

function SignUpPage() {
  const { redirectTo } = Route.useSearch()
  return <AuthForm type="sign-up" redirectTo={redirectTo} />
}
