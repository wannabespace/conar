import { Badge } from '@connnect/ui/components/badge'
import { Button } from '@connnect/ui/components/button'
import { DotsBg } from '@connnect/ui/components/custom/dots-bg'
import { RiExternalLinkLine } from '@remixicon/react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Video } from './-components/video'

export const Route = createFileRoute('/_layout/')({
  component: Home,
})

function Home() {
  return (
    <div className="space-y-20 py-20">
      <DotsBg
        className="absolute -z-10 inset-0 [mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)]"
      />
      <div className="max-w-3xl mx-auto pt-30 pb-20 px-4">
        <div className="flex flex-col items-center text-center gap-8">
          <Badge asChild variant="secondary">
            <a href="https://github.com/wannabespace/connnect/releases/latest" target="_blank" rel="noopener noreferrer">
              Connnect is now available on macOS!
              <RiExternalLinkLine className="size-3 text-muted-foreground" />
            </a>
          </Badge>
          <h1
            className="text-6xl font-bold tracking-tight text-balance bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent"
          >
            Improve your
            {' '}
            <span className="text-primary">connections</span>
            {' '}
            management experience
          </h1>
          <p className="text-2xl text-muted-foreground text-balance max-w-xl">
            AI-powered tool that makes database operations easier. Built for PostgreSQL, Modern alternative to traditional database management tools.
          </p>
          <div className="flex gap-3">
            <Button
              size="lg"
              className="gap-2"
              asChild
            >
              <Link to="/download">
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <Video />
    </div>
  )
}
