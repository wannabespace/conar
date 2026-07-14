import type { ComponentProps } from 'react'
import { lazy, Suspense } from 'react'

import type { Markdown as MarkdownImpl } from './markdown'

const LazyMarkdown = lazy(() => import('./markdown').then(m => ({ default: m.Markdown })))

export function Markdown(props: ComponentProps<typeof MarkdownImpl>) {
  return (
    <Suspense fallback={<div className={props.className} />}>
      <LazyMarkdown {...props} />
    </Suspense>
  )
}
