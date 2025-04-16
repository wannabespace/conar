import { title as titleFn } from '@connnect/shared/utils/title'

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
  const _title = titleFn(title)

  const tags = [
    { title: _title },
    { name: 'description', content: description },
    { name: 'keywords', content: keywords },
    { name: 'twitter:title', content: _title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:creator', content: '@letstri' },
    { name: 'twitter:site', content: '@letstri' },
    { name: 'og:type', content: 'website' },
    { name: 'og:title', content: _title },
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
