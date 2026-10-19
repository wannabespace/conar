const SITE_URL = 'https://docs.tamery.app'

export const docsHead = ({
  description,
  href,
  title,
}: {
  description: string
  href: string
  title: string
}) => {
  const pageUrl = `${SITE_URL}${href === '/' ? '' : href}`
  const fullTitle = `${title} · Tamery`

  return {
    links: [{ href: pageUrl, rel: 'canonical' }],
    meta: [
      { title: fullTitle },
      { content: description, name: 'description' },
      { content: 'summary', name: 'twitter:card' },
      { content: '@tamery_app', name: 'twitter:site' },
      { content: fullTitle, name: 'twitter:title' },
      { content: description, name: 'twitter:description' },
      { content: 'website', property: 'og:type' },
      { content: 'Tamery', property: 'og:site_name' },
      { content: pageUrl, property: 'og:url' },
      { content: fullTitle, property: 'og:title' },
      { content: description, property: 'og:description' },
    ],
  }
}
