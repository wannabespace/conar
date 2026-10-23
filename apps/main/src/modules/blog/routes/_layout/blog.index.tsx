import { Badge } from '@tamery/ui/components/badge'
import { createFileRoute, Link } from '@tanstack/react-router'
import { format } from 'date-fns'

import { seo } from '~/utils/seo'

import { ConnectionPlayground } from '../../components/connection-playground'
import { blogPosts } from '../../posts'

const BlogPage = () => (
  <main className="mx-auto w-full max-w-6xl px-4 pt-16 pb-24 sm:px-6 sm:pt-24">
    <header className="mb-10 flex max-w-2xl flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Blog
      </h1>
      <p className="text-muted-foreground text-base text-pretty sm:text-lg">
        The longer stories behind Tamery, and hands-on guides for connecting to
        every database it speaks.
      </p>
    </header>
    <div className="mb-16 max-w-2xl">
      <p className="text-muted-foreground mb-3 text-sm">
        Every guide ships a live parser. Paste any connection string and watch
        Tamery read it apart:
      </p>
      <ConnectionPlayground />
    </div>
    <ol className="grid gap-4 sm:grid-cols-2">
      {blogPosts.map((post) => (
        <li key={post.slug}>
          <Link
            className="group bg-card ring-foreground/8 hover:ring-foreground/15 ease-house flex h-full flex-col gap-3 rounded-2xl p-5 shadow-sm ring transition-[box-shadow,transform] hover:-translate-y-0.5"
            params={{ slug: post.slug }}
            to="/blog/$slug"
          >
            <div className="flex items-center justify-between gap-2">
              <Badge variant="secondary">{post.engine}</Badge>
              <time
                className="text-muted-foreground text-xs"
                dateTime={post.publishedAt}
              >
                {format(new Date(post.publishedAt), 'MMM d, yyyy')}
              </time>
            </div>
            <h2 className="text-foreground group-hover:text-foreground text-lg font-semibold tracking-tight">
              {post.title}
            </h2>
            <p className="text-muted-foreground text-sm text-pretty">
              {post.description}
            </p>
          </Link>
        </li>
      ))}
    </ol>
  </main>
)

export const Route = createFileRoute('/_layout/blog/')({
  component: BlogPage,
  head: () =>
    seo({
      title: 'Blog - Tamery',
      description:
        'Hands-on guides for connecting to every database Tamery speaks, each with a live connection-string parser, plus the reasoning behind the product.',
      image: '/og-image.png',
      path: '/blog',
    }),
})
