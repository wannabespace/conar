import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Badge } from '@tamery/ui/components/badge'
import { responseVariants } from '@tamery/ui/components/response.utils'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { format } from 'date-fns'

import { seo } from '~/utils/seo'

import { postBodies } from '../../bodies'
import { mdxComponents } from '../../components/mdx-components'
import { TableOfContents } from '../../components/table-of-contents'
import { BLOG_AUTHOR, findPost } from '../../posts'

const BlogPostPage = () => {
  const { post } = Route.useLoaderData()
  const Body = postBodies[post.slug]

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <Link
        className="text-muted-foreground hover:text-foreground ease-house mb-10 inline-flex items-center gap-1.5 text-sm transition-colors"
        to="/blog"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
        Blog
      </Link>
      <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <article className="max-w-3xl min-w-0">
          <header className="mb-10 flex flex-col gap-4">
            <Badge className="w-fit" variant="secondary">
              {post.engine}
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {post.title}
            </h1>
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <span>{BLOG_AUTHOR}</span>
              <span aria-hidden>·</span>
              <time dateTime={post.publishedAt}>
                {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
              </time>
            </div>
          </header>
          <div className={responseVariants({ variant: 'document' })}>
            {Body && <Body components={mdxComponents} />}
          </div>
        </article>
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <TableOfContents />
          </div>
        </aside>
      </div>
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
