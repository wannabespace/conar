export const SITE_URL = 'https://conar.app'

function absoluteUrl(pathOrUrl: string) {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

export function seo({
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
}) {
  const pageUrl = absoluteUrl(path)
  const imageUrl = image ? absoluteUrl(image) : undefined

  const meta = [
    { title },
    ...(description ? [{ name: 'description', content: description }] : []),
    ...(keywords ? [{ name: 'keywords', content: keywords }] : []),
    { name: 'twitter:card', content: imageUrl ? 'summary_large_image' : 'summary' },
    { name: 'twitter:site', content: '@conar_app' },
    { name: 'twitter:creator', content: '@letstri' },
    { name: 'twitter:url', content: pageUrl },
    { name: 'twitter:title', content: title },
    ...(description ? [{ name: 'twitter:description', content: description }] : []),
    ...(imageUrl ? [{ name: 'twitter:image', content: imageUrl }] : []),
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'en_US' },
    { property: 'og:site_name', content: 'Conar' },
    { property: 'og:url', content: pageUrl },
    { property: 'og:title', content: title },
    ...(description ? [{ property: 'og:description', content: description }] : []),
    ...(imageUrl
      ? [
          { property: 'og:image', content: imageUrl },
          { property: 'og:image:type', content: 'image/png' },
          { property: 'og:image:width', content: '1200' },
          { property: 'og:image:height', content: '630' },
          { property: 'og:image:alt', content: title },
        ]
      : []),
  ]

  const links = [
    { rel: 'canonical', href: pageUrl },
  ]

  return { meta, links }
}
