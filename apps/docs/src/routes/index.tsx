import { createFileRoute, getRouteApi } from '@tanstack/react-router'

import { DocsScreen } from '~/components/docs-screen'
import { docs } from '~/lib/collections'
import { loadDocsPage } from '~/lib/page'
import type { DocsPageData } from '~/lib/page'
import { docsHead } from '~/seo'

const { useLoaderData } = getRouteApi('/')

const Home = () => {
  const data = useLoaderData()

  return <DocsScreen key={data.href} data={data} />
}

export const Route = createFileRoute('/')({
  component: Home,
  head: ({ loaderData }) => (loaderData ? docsHead(loaderData) : {}),
  loader: async (): Promise<DocsPageData> => {
    const data = await loadDocsPage({ data: [] })
    await docs.getPage(data.path)?.preload()

    return data
  },
})
