import { useIsMounted } from '@conar/ui/hookas/use-is-mounted'
import { type ComponentProps, Suspense } from 'react'

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
