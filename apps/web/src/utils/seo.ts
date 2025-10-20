export function seo({
  title,
  description,
  keywords,
  image,
}: {
  title: string
  description?: string
  image?: string
  keywords?: string
}) {
  const tags = [
    { title },
    { name: 'description', content: description },
    { name: 'keywords', content: keywords },
    { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
    { name: 'twitter:site', content: '@letstri' },
    { name: 'twitter:creator', content: '@letstri' },
    { name: 'twitter:url', content: 'https://conar.app' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    ...(image ? [{ name: 'twitter:image', content: image }] : []),
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Conar' },
    { property: 'og:url', content: 'https://conar.app' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
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
