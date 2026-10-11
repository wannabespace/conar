import {
  ArrowRight01Icon,
  GithubIcon,
  SquareLock02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { SOCIAL_LINKS } from '@tamery/shared/constants'
import { Button } from '@tamery/ui/components/button'
import { MeshBackground } from '@tamery/ui/components/custom/mesh-background'
import { cn } from '@tamery/ui/lib/utils'
import { Link } from '@tanstack/react-router'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { Fragment } from 'react'

import { DownloadButton } from '~/components/download-button'

import { Showcase } from './showcase/showcase'

const riseClassName =
  'animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-600 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:animate-none'

const WORD_STAGGER_MS = 60

const HEADLINE_WORDS = 'The database client for you and your agents'.split(' ')

const TILT_DEGREES = 14
const TILT_SCROLL_DISTANCE = 480

const TiltedShowcase = () => {
  const reduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const rotateX = useTransform(
    scrollY,
    [0, TILT_SCROLL_DISTANCE],
    [TILT_DEGREES, 0]
  )

  return (
    <motion.div style={reduceMotion ? undefined : { rotateX }}>
      <Showcase />
    </motion.div>
  )
}

export const Hero = () => (
  <section className="overflow-x-clip pt-14 sm:pt-20">
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6">
      <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
        {HEADLINE_WORDS.map((word, index) => (
          <Fragment key={word}>
            {index > 0 && ' '}
            <span
              // oxlint-disable-next-line shadcn/no-inline-styles -- each word's stagger is its index times a step, which no class can describe
              style={{ animationDelay: `${index * WORD_STAGGER_MS}ms` }}
              className="animate-in fade-in blur-in-md slide-in-from-bottom-3 fill-mode-both inline-block duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:animate-none"
            >
              {word}
            </span>
          </Fragment>
        ))}
      </h1>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col items-start gap-6">
          <p
            className={cn(
              riseClassName,
              'text-muted-foreground max-w-md text-lg text-pretty delay-350'
            )}
          >
            <span className="text-foreground">
              Postgres, MySQL, SQL Server and ClickHouse in one fast client.
            </span>{' '}
            AI writes the SQL, and your agents query through MCP.
          </p>
          <div className={cn(riseClassName, 'flex flex-wrap gap-2 delay-430')}>
            <DownloadButton />
            <Button
              variant="outline"
              size="lg"
              render={
                <a
                  href={import.meta.env.VITE_PUBLIC_WEB_URL}
                  aria-label="Open Tamery in your browser"
                />
              }
            >
              Open in browser
            </Button>
          </div>
          <ul
            className={cn(
              riseClassName,
              'text-muted-foreground flex flex-wrap gap-x-5 gap-y-2 text-sm delay-470'
            )}
          >
            <li className="flex">
              <a
                href={SOCIAL_LINKS.GITHUB}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
              >
                <HugeiconsIcon
                  icon={GithubIcon}
                  strokeWidth={2}
                  className="size-4"
                />
                Open source, AGPL-3.0
              </a>
            </li>
            <li className="flex items-center gap-1.5">
              <HugeiconsIcon
                icon={SquareLock02Icon}
                strokeWidth={2}
                className="size-4"
              />
              Connection strings encrypted per workspace
            </li>
          </ul>
        </div>
        <div className={cn(riseClassName, 'flex h-5 items-center delay-510')}>
          <Link
            to="/releases"
            className="group text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
          >
            <span className="text-foreground font-medium">New</span>
            Local MCP server in the desktop app
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={2}
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </div>
    <div className="animate-in fade-in slide-in-from-bottom-10 fill-mode-both mx-auto mt-12 max-w-7xl px-4 delay-550 duration-1100 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:animate-none sm:mt-16 sm:px-6">
      <div className="bg-primary relative isolate h-120 overflow-hidden rounded-3xl px-4 pt-10 perspective-distant sm:h-144 sm:px-8 sm:pt-16 xl:px-16">
        <MeshBackground className="-z-10" />
        <TiltedShowcase />
      </div>
    </div>
  </section>
)
