export function seo({
  title,
  description,
  keywords,
  image,
  url,
}: {
  title: string
  description?: string
  image?: string
  keywords?: string
  url?: string
}) {
  const pageUrl = url ?? 'https://conar.app'

  const tags = [
    { title },
    ...(description ? [{ name: 'description', content: description }] : []),
    ...(keywords ? [{ name: 'keywords', content: keywords }] : []),
    { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
    { name: 'twitter:site', content: '@letstri' },
    { name: 'twitter:creator', content: '@letstri' },
    { name: 'twitter:url', content: pageUrl },
    { name: 'twitter:title', content: title },
    ...(description ? [{ name: 'twitter:description', content: description }] : []),
    ...(image ? [{ name: 'twitter:image', content: image }] : []),
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'en_US' },
    { property: 'og:site_name', content: 'Conar' },
    { property: 'og:url', content: pageUrl },
    { property: 'og:title', content: title },
    ...(description ? [{ property: 'og:description', content: description }] : []),
    ...(image
      ? [
          { property: 'og:image', content: image },
          { property: 'og:image:width', content: '1200' },
          { property: 'og:image:height', content: '630' },
          { property: 'og:image:alt', content: title },
        ]
      : []),
  ]

  return tags
}
