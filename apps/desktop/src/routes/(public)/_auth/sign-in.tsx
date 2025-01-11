import { createFileRoute, Link } from '@tanstack/react-router'
import { AuthForm } from './-components/auth-form'

export const Route = createFileRoute('/(public)/_auth/sign-in')({
  component: SignInPage,
})

function SignInPage() {
  return (
    <>
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          Sign in to Connnect
        </h1>
        <p className="text-sm text-muted-foreground">
          Don't have an account?
          {' '}
          <Link to="/sign-up">Sign up</Link>
        </p>
      </div>
      <AuthForm type="sign-in" />
    </>
  )
}
