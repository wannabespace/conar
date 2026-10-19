import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { getNav, getNeighbours } from './nav'
import type { DocsLink, DocsTab } from './nav'
import { source } from './source'

export interface DocsPageData {
  description: string
  href: string
  nav: DocsTab[]
  next: DocsLink | null
  path: string
  previous: DocsLink | null
  title: string
}

export const loadDocsPage = createServerFn({ method: 'GET' })
  .validator((slugs: string[]) => slugs)
  .handler(({ data: slugs }): DocsPageData => {
    const page = source.getPage(slugs)

    if (!page) {
      throw notFound()
    }

    const nav = getNav()
    const neighbours = getNeighbours(page.url, nav)

    return {
      description: page.data.description ?? '',
      href: page.url,
      nav,
      next: neighbours.next,
      path: page.path,
      previous: neighbours.previous,
      title: page.data.title,
    }
  })
