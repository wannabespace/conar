import { createFileRoute, redirect } from '@tanstack/react-router'

import { authClient } from '~/lib/auth'

import { AuthForm } from './-components/auth-form'

export const Route = createFileRoute('/_auth/sign-in')({
  component: SignInPage,
  loader: async () => {
    const { data } = await authClient.getSession()

    if (data?.user) {
      throw redirect({ to: '/account' })
    }
  },
})

// oxlint-disable-next-line react/only-export-components
function SignInPage() {
  return <AuthForm type="sign-in" />
}
