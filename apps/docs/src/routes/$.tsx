import { createFileRoute, notFound } from '@tanstack/react-router'

import { DocsScreen } from '~/components/docs-screen'
import { SITE_URL, WEB_URL } from '~/constants'
import { source } from '~/lib/source'

const OG_IMAGE_URL = `${WEB_URL}/og-image.png`

const getDocsPage = (splat: string | undefined) => {
  const page = source.getPage(splat?.split('/').filter(Boolean))

  if (!page) {
    throw notFound()
  }

  return page
}

const DocsRoute = () => {
  const page = getDocsPage(Route.useParams()._splat)

  return <DocsScreen page={page} />
}

export const Route = createFileRoute('/$')({
  component: DocsRoute,
  head: ({ params }) => {
    const page = getDocsPage(params._splat)
    const pageUrl = `${SITE_URL}${page.url}`
    const title =
      page.url === '/' ? 'Tamery Docs' : `${page.data.title} · Tamery Docs`
    const description = page.data.description ?? ''

    return {
      links: [{ href: pageUrl, rel: 'canonical' }],
      meta: [
        { title },
        { content: description, name: 'description' },
        { content: 'summary_large_image', name: 'twitter:card' },
        { content: '@tamery_app', name: 'twitter:site' },
        { content: title, name: 'twitter:title' },
        { content: description, name: 'twitter:description' },
        { content: OG_IMAGE_URL, name: 'twitter:image' },
        {
          content: page.url === '/' ? 'website' : 'article',
          property: 'og:type',
        },
        { content: 'Tamery', property: 'og:site_name' },
        { content: pageUrl, property: 'og:url' },
        { content: title, property: 'og:title' },
        { content: description, property: 'og:description' },
        { content: OG_IMAGE_URL, property: 'og:image' },
        { content: '1200', property: 'og:image:width' },
        { content: '630', property: 'og:image:height' },
      ],
    }
  },
  loader: ({ params }) => getDocsPage(params._splat).data.preload(),
})
