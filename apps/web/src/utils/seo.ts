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
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:creator', content: '@letstri' },
    { name: 'twitter:domain', content: 'conar.app' },
    { name: 'twitter:url', content: 'https://conar.app' },
    { name: 'og:type', content: 'website' },
    { name: 'og:url', content: 'https://conar.app' },
    { name: 'og:title', content: title },
    { name: 'og:description', content: description },
    ...(image
      ? [
          { name: 'twitter:image', content: image },
          { name: 'twitter:card', content: 'summary_large_image' },
          { name: 'og:image', content: image },
        ]
      : []),
  ]

  return tags
}
