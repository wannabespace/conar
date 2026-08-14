import { createFileRoute, redirect } from '@tanstack/react-router'

import { authClient } from '~/lib/auth'

import { AuthForm } from './-components/auth-form'

const SignUpPage = () => <AuthForm type="sign-up" />

export const Route = createFileRoute('/_auth/sign-up')({
  component: SignUpPage,
  loader: async () => {
    const { data } = await authClient.getSession()

    if (data?.user) {
      throw redirect({ to: '/account' })
    }
  },
})
