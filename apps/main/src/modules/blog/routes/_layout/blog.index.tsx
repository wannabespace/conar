import { createFileRoute, Link } from '@tanstack/react-router'
import { format } from 'date-fns'

import { seo } from '~/utils/seo'

import { blogPosts } from '../../posts'

const BlogPage = () => (
  <main className="mx-auto w-full max-w-3xl px-4 pt-16 pb-24 sm:px-6 sm:pt-28">
    <header className="mb-12 flex flex-col gap-4">
      <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Blog
      </h1>
      <p className="text-muted-foreground text-lg text-pretty">
        Hands-on guides for connecting Tamery to every database it speaks.
      </p>
    </header>
    <ol className="flex flex-col">
      {blogPosts.map((post) => (
        <li key={post.slug}>
          <Link
            className="group border-border/60 flex flex-col gap-2 border-t py-7 first:border-t-0"
            params={{ slug: post.slug }}
            to="/blog/$slug"
          >
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <span className="text-foreground/70 font-medium">
                {post.engine}
              </span>
              <span aria-hidden>·</span>
              <time dateTime={post.publishedAt}>
                {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
              </time>
            </div>
            <h2 className="text-foreground group-hover:text-primary ease-house text-xl font-semibold tracking-tight transition-colors">
              {post.title}
            </h2>
            <p className="text-muted-foreground text-pretty">
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
