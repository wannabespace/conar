import type { ComponentProps } from 'react'
import type { TipTap as TipTapImpl } from './tiptap'
import { lazy, Suspense } from 'react'

const LazyTipTap = lazy(() => import('./tiptap').then(m => ({ default: m.TipTap })))

export function TipTap(props: ComponentProps<typeof TipTapImpl>) {
  return (
    <Suspense fallback={null}>
      <LazyTipTap {...props} />
    </Suspense>
  )
}
