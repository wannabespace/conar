import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Response } from '@tamery/ui/components/response'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { format } from 'date-fns'

import { seo } from '~/utils/seo'

import { findPost } from '../../posts'

const BlogPostPage = () => {
  const { post } = Route.useLoaderData()

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <Link
        to="/blog"
        className="text-muted-foreground hover:text-foreground mb-10 inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
        Blog
      </Link>
      <header className="mb-12 flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {post.title}
        </h1>
        <time
          dateTime={post.publishedAt}
          className="text-muted-foreground text-sm"
        >
          {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
        </time>
      </header>
      <Response variant="document" mode="static">
        {post.content}
      </Response>
    </main>
  )
}

export const Route = createFileRoute('/_layout/blog/$slug')({
  component: BlogPostPage,
  loader: ({ params }) => {
    const post = findPost(params.slug)
    if (!post) {
      throw notFound()
    }
    return { post }
  },
  head: ({ params }) => {
    const post = findPost(params.slug)
    if (!post) {
      return {}
    }
    return seo({
      title: `${post.title} - Tamery`,
      description: post.description,
      image: '/og-image.png',
      path: `/blog/${post.slug}`,
    })
  },
})
