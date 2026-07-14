import type { ComponentProps } from 'react'
import { lazy, Suspense } from 'react'

import type { TipTap as TipTapImpl } from './tiptap'

const LazyTipTap = lazy(() => import('./tiptap').then(m => ({ default: m.TipTap })))

export function TipTap(props: ComponentProps<typeof TipTapImpl>) {
  return (
    <Suspense fallback={null}>
      <LazyTipTap {...props} />
    </Suspense>
  )
}
