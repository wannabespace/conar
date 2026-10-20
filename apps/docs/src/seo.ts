import { SITE_URL } from './constants'
import type { DocsPage } from './lib/source'

export const docsHead = (page: DocsPage) => {
  const pageUrl = `${SITE_URL}${page.url === '/' ? '' : page.url}`
  const title = `${page.data.title} · Tamery`
  const description = page.data.description ?? ''

  return {
    links: [{ href: pageUrl, rel: 'canonical' }],
    meta: [
      { title },
      { content: description, name: 'description' },
      { content: 'summary', name: 'twitter:card' },
      { content: '@tamery_app', name: 'twitter:site' },
      { content: title, name: 'twitter:title' },
      { content: description, name: 'twitter:description' },
      { content: 'website', property: 'og:type' },
      { content: 'Tamery', property: 'og:site_name' },
      { content: pageUrl, property: 'og:url' },
      { content: title, property: 'og:title' },
      { content: description, property: 'og:description' },
    ],
  }
}
