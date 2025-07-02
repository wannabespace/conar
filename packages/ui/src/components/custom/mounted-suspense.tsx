import type { ComponentProps } from 'react'
import { useIsMounted } from '@conar/ui/hookas/use-is-mounted'
import { Suspense } from 'react'

export function MountedSuspense({ fallback, children, ...props }: ComponentProps<typeof Suspense>) {
  const isMounted = useIsMounted()

  if (!isMounted)
    return fallback

  return (
    <Suspense fallback={fallback} {...props}>
      {children}
    </Suspense>
  )
}
