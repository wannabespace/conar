import { createFileRoute, Link } from '@tanstack/react-router'
import { AuthForm } from './-components/auth-form'

export const Route = createFileRoute('/(public)/_auth/sign-up')({
  component: SignUpPage,
})

function SignUpPage() {
  return (
    <>
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          Sign up to Connnect
        </h1>
        <p className="text-sm text-muted-foreground">
          Already have an account?
          {' '}
          <Link to="/sign-in">Sign in</Link>
        </p>
      </div>
      <AuthForm type="sign-up" />
    </>
  )
}
