import { Badge } from '@connnect/ui/components/badge'
import { Button } from '@connnect/ui/components/button'
import { DotPattern } from '@connnect/ui/components/magicui/dot-pattern'
import { RiExternalLinkLine } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '~/components/navbar'
import { Video } from './-components/video'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="space-y-20 py-20">
      <Navbar />
      <DotPattern
        width={20}
        height={20}
        className="absolute -z-10 top-0 left-0 [mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)]"
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
            AI-powered tool that makes database operations easier. Built for PostgreSQL, it's a modern alternative to traditional database management tools.
          </p>
          <div className="flex gap-3">
            <Button
              size="lg"
              className="gap-2"
              asChild
            >
              <a href="https://github.com/wannabespace/connnect/releases/latest" target="_blank" rel="noopener noreferrer">
                Get Started
              </a>
            </Button>
          </div>
        </div>
      </div>
      <Video />
    </div>
  )
}
