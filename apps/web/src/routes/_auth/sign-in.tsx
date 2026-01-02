import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSessionIsomorphic } from '~/lib/auth'
import { AuthForm } from './-components/auth-form'

export const Route = createFileRoute('/_auth/sign-in')({
  component: SignInPage,
  loader: async () => {
    const { data } = await getSessionIsomorphic()

    if (data?.user) {
      throw redirect({ to: '/account' })
    }
  },
})

function SignInPage() {
  return <AuthForm type="sign-in" />
}
