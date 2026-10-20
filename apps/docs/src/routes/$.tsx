import { createFileRoute, notFound } from '@tanstack/react-router'

import { DocsScreen } from '~/components/docs-screen'
import { source } from '~/lib/source'
import { docsHead } from '~/seo'

const getDocsPage = (splat: string | undefined) => {
  const page = source.getPage(splat?.split('/').filter(Boolean))

  if (!page) {
    throw notFound()
  }

  return page
}

const DocsRoute = () => {
  const page = getDocsPage(Route.useParams()._splat)

  return <DocsScreen key={page.url} page={page} />
}

export const Route = createFileRoute('/$')({
  component: DocsRoute,
  head: ({ params }) => docsHead(getDocsPage(params._splat)),
  loader: ({ params }) => getDocsPage(params._splat).data.preload(),
})
