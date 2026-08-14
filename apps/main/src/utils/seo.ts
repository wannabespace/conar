export const SITE_URL = 'https://tamery.app'

const absoluteUrl = (pathOrUrl: string) => {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

export const seo = ({
  title,
  description,
  keywords,
  image,
  path = '/',
}: {
  title: string
  description?: string
  image?: string
  keywords?: string
  path?: string
}) => {
  const pageUrl = absoluteUrl(path)
  const imageUrl = image ? absoluteUrl(image) : undefined

  const meta = [
    { title },
    ...(description ? [{ content: description, name: 'description' }] : []),
    ...(keywords ? [{ content: keywords, name: 'keywords' }] : []),
    {
      content: imageUrl ? 'summary_large_image' : 'summary',
      name: 'twitter:card',
    },
    { content: '@tamery_app', name: 'twitter:site' },
    { content: '@letstri', name: 'twitter:creator' },
    { content: pageUrl, name: 'twitter:url' },
    { content: title, name: 'twitter:title' },
    ...(description
      ? [{ content: description, name: 'twitter:description' }]
      : []),
    ...(imageUrl ? [{ content: imageUrl, name: 'twitter:image' }] : []),
    { content: 'website', property: 'og:type' },
    { content: 'en_US', property: 'og:locale' },
    { content: 'Tamery', property: 'og:site_name' },
    { content: pageUrl, property: 'og:url' },
    { content: title, property: 'og:title' },
    ...(description
      ? [{ content: description, property: 'og:description' }]
      : []),
    ...(imageUrl
      ? [
          { content: imageUrl, property: 'og:image' },
          { content: 'image/png', property: 'og:image:type' },
          { content: '1200', property: 'og:image:width' },
          { content: '630', property: 'og:image:height' },
          { content: title, property: 'og:image:alt' },
        ]
      : []),
  ]

  const links = [{ href: pageUrl, rel: 'canonical' }]

  return { links, meta }
}
