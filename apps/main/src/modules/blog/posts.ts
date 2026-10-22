import aPlaceToWriteThingsDown from './content/a-place-to-write-things-down.md?raw'

export interface BlogPost {
  slug: string
  title: string
  description: string
  publishedAt: string
  content: string
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'a-place-to-write-things-down',
    title: 'A place to write things down',
    description:
      'Why Tamery has a blog now, and what goes here instead of the changelog.',
    publishedAt: '2026-10-23',
    content: aPlaceToWriteThingsDown,
  },
].toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt))

export const findPost = (slug: string) =>
  blogPosts.find((post) => post.slug === slug)
