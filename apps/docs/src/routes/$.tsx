import { createFileRoute, getRouteApi } from '@tanstack/react-router'

import { DocsScreen } from '~/components/docs-screen'
import { docs } from '~/lib/collections'
import { loadDocsPage } from '~/lib/page'
import type { DocsPageData } from '~/lib/page'
import { docsHead } from '~/seo'

const { useLoaderData } = getRouteApi('/$')

const loadSplatPage = async (
  splat: string | undefined
): Promise<DocsPageData> => {
  const slugs = splat?.split('/').filter(Boolean) ?? []
  const data = await loadDocsPage({ data: slugs })
  await docs.getPage(data.path)?.preload()

  return data
}

const Page = () => {
  const data = useLoaderData()

  return <DocsScreen key={data.href} data={data} />
}

export const Route = createFileRoute('/$')({
  component: Page,
  head: ({ loaderData }) => (loaderData ? docsHead(loaderData) : {}),
  // The annotation is required. Inferring `params` from `/$` cycles through
  // routeTree.gen and collapses this route's loader data to `undefined`.
  loader: ({ params }: { params: { _splat?: string } }) =>
    loadSplatPage(params._splat),
})
