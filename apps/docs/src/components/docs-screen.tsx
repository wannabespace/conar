import { notFound } from '@tanstack/react-router'
import { use } from 'react'

import { docs } from '~/lib/collections'
import type { DocsPageData } from '~/lib/page'

import { DocsShell } from './docs-shell'
import { mdxComponents } from './mdx'

const DocsContent = ({
  data,
  page,
}: {
  data: DocsPageData
  page: NonNullable<ReturnType<typeof docs.getPage>>
}) => {
  const loaded = use(page.load())
  const Content = page.body

  return (
    <DocsShell data={data} toc={loaded.toc}>
      <Content components={mdxComponents} />
    </DocsShell>
  )
}

export const DocsScreen = ({ data }: { data: DocsPageData }) => {
  const page = docs.getPage(data.path)

  if (!page) {
    throw notFound()
  }

  return <DocsContent data={data} page={page} />
}
