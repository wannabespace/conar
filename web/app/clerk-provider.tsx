'use client'

import { ClerkProvider as Provider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useTheme } from 'next-themes'

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()

  return (
    <Provider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInForceRedirectUrl="/redirect"
      signUpForceRedirectUrl="/redirect"
      afterSignOutUrl="/redirect"
      experimental={{ persistClient: true }}
      appearance={{
        baseTheme: resolvedTheme === 'dark' ? dark : undefined,
        elements: {
          avatarBox: {
            borderRadius: '8px',
          },
          userButtonTrigger: 'rounded-lg',
          userButtonAvatarBox: 'size-full',
          cardBox: 'shadow-none',
          card: 'shadow-none bg-transparent',
          footer: 'bg-none',
          formFieldInput: 'bg-transparent',
        },
      }}
    >
      {children}
    </Provider>
  )
}
