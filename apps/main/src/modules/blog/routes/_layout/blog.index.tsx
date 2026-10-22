import { createFileRoute, Link } from '@tanstack/react-router'
import { format } from 'date-fns'

import { seo } from '~/utils/seo'

import { blogPosts } from '../../posts'

const BlogPage = () => (
  <main className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 sm:pt-24">
    <header className="mb-16 flex max-w-2xl flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Blog
      </h1>
      <p className="text-muted-foreground text-base text-pretty sm:text-lg">
        The longer stories behind Tamery. Decisions, fixes and the reasoning
        that does not fit in a changelog.
      </p>
    </header>
    <ol className="flex flex-col gap-16">
      {blogPosts.map((post) => (
        <li
          key={post.slug}
          className="grid gap-3 md:grid-cols-[12rem_1fr] md:gap-12"
        >
          <time
            dateTime={post.publishedAt}
            className="text-muted-foreground text-sm md:pt-1.5"
          >
            {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
          </time>
          <article className="flex max-w-3xl min-w-0 flex-col gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              <Link
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="text-foreground hover:text-muted-foreground transition-colors"
              >
                {post.title}
              </Link>
            </h2>
            <p className="text-muted-foreground text-pretty">
              {post.description}
            </p>
          </article>
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
        'The longer stories behind Tamery. Decisions, fixes and the reasoning that does not fit in a changelog.',
      image: '/og-image.png',
      path: '/blog',
    }),
})
