import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps } from 'react'
import { lazy, Suspense } from 'react'

import type { MonacoDiff as MonacoDiffImpl, Monaco as MonacoImpl } from './monaco'

const LazyMonaco = lazy(() => import('./monaco').then(m => ({ default: m.Monaco })))
const LazyMonacoDiff = lazy(() => import('./monaco').then(m => ({ default: m.MonacoDiff })))

function Fallback({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn('animate-pulse rounded-md bg-muted/30', className)} style={style} />
}

export function Monaco(props: ComponentProps<typeof MonacoImpl>) {
  return (
    <Suspense fallback={<Fallback className={props.className} style={props.style} />}>
      <LazyMonaco {...props} />
    </Suspense>
  )
}

export function MonacoDiff(props: ComponentProps<typeof MonacoDiffImpl>) {
  return (
    <Suspense fallback={<Fallback className={props.className} style={props.style} />}>
      <LazyMonacoDiff {...props} />
    </Suspense>
  )
}
