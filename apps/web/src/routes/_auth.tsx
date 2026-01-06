import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { Button } from '@conar/ui/components/button'
import { FieldDescription } from '@conar/ui/components/field'
import { createFileRoute, Link, Outlet, useMatches } from '@tanstack/react-router'
import { SEO } from '~/constants'

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  const match = useMatches({
    select: matches => matches.map(match => match.routeId).at(-1),
  })
  const isSignIn = match === '/_auth/sign-in'

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className={`
        relative grid flex-1 shrink-0 items-center justify-center
        lg:grid-cols-2
      `}
      >
        <div className={`
          relative hidden h-full flex-col border-r bg-primary/5 p-10
          text-primary
          lg:flex
        `}
        >
          <div className="relative z-20 flex items-center text-lg font-medium">
            <AppLogo className="mr-2 size-6" />
            Conar
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="leading-normal text-balance">
              {SEO.description}
            </blockquote>
          </div>
        </div>
        <div className={`
          flex items-center justify-center p-4
          lg:p-8
        `}
        >
          <div className={`
            absolute top-4 right-4
            md:top-8 md:right-8
          `}
          >
            {isSignIn
              ? (
                  <Button variant="link" asChild>
                    <Link to="/">
                      Home
                    </Link>
                  </Button>
                )
              : (
                  <Button variant="link" asChild>
                    <Link to="/sign-in">
                      Sign in
                    </Link>
                  </Button>
                )}
          </div>
          <div className={`
            mx-auto flex w-full flex-col justify-center gap-6
            sm:w-[350px]
          `}
          >
            <Outlet />
            {isSignIn && (
              <FieldDescription className="px-6 text-center">
                By clicking continue, you agree to our
                {' '}
                <Link
                  to="/terms-of-service"
                  className={`
                    underline underline-offset-4
                    hover:text-primary
                  `}
                >
                  Terms of Service
                </Link>
                {' '}
                and
                {' '}
                <Link
                  to="/privacy-policy"
                  className={`
                    underline underline-offset-4
                    hover:text-primary
                  `}
                >
                  Privacy Policy
                </Link>
                .
              </FieldDescription>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
