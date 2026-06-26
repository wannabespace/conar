import { RiAddLine, RiDiscordLine, RiDownloadLine, RiGithubLine, RiGlobalLine, RiTwitterXLine } from '@remixicon/react'
import { SOCIAL_LINKS } from '@tamery/shared/constants'
import { pick } from '@tamery/shared/utils/helpers'
import { title } from '@tamery/shared/utils/title'
import { Button } from '@tamery/ui/components/button'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { Separator } from '@tamery/ui/components/separator'
import { Spinner } from '@tamery/ui/components/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSubscription } from 'seitu/react'
import { checkForUpdates, updatesStore } from '~/use-updates-observer'
import { ConnectionsList } from './-components/connections-list'
import { Profile } from './-components/profile'

export const Route = createFileRoute('/_protected/')({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: title('Dashboard') }],
  }),
})

// eslint-disable-next-line react-refresh/only-export-components
function DashboardPage() {
  const { version, status } = useSubscription(updatesStore, { selector: state => pick(state, ['version', 'status']) })

  return (
    <ScrollArea className="overflow-auto">
      <div className="mx-auto flex size-full max-w-2xl flex-col px-6 py-10">
        <h1 className={`
          mb-6 scroll-m-20 text-4xl font-extrabold tracking-tight
          lg:text-5xl
        `}
        >
          Dashboard
        </h1>
        <Profile className="mb-8" />
        <div className="mb-6 flex items-center justify-between">
          <h2 className={`
            text-3xl font-bold
            lg:text-4xl
          `}
          >
            Connections
          </h2>
          <div className="flex items-center gap-2">
            <Button render={<Link to="/create" />}>
              <RiAddLine className="size-4" />
              Add new
            </Button>
          </div>
        </div>
        <ConnectionsList />
        <div className="mt-auto py-6">
          <Separator />
          <div className="mt-3 flex items-center gap-2">
            <a
              href="https://tamery.app"
              target="_blank"
              rel="noopener noreferrer"
              className={`
                p-1 text-muted-foreground/50 transition-colors
                hover:text-muted-foreground/70
              `}
            >
              <RiGlobalLine className="size-4" />
            </a>
            <a
              href={SOCIAL_LINKS.TWITTER}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                p-1 text-muted-foreground/50 transition-colors
                hover:text-muted-foreground/70
              `}
            >
              <RiTwitterXLine className="size-4" />
            </a>
            <a
              href={SOCIAL_LINKS.DISCORD}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                p-1 text-muted-foreground/50 transition-colors
                hover:text-muted-foreground/70
              `}
            >
              <RiDiscordLine className="size-4" />
            </a>
            <a
              href={SOCIAL_LINKS.GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                p-1 text-muted-foreground/50 transition-colors
                hover:text-muted-foreground/70
              `}
            >
              <RiGithubLine className="size-4" />
            </a>
            <Separator orientation="vertical" className="h-4!" />
            <button
              type="button"
              onClick={() => checkForUpdates()}
              className={`
                cursor-pointer text-xs text-muted-foreground/50
                transition-colors
                hover:text-muted-foreground/70
              `}
            >
              Current version
              {' '}
              v
              {version}
            </button>
            {' '}
            {status === 'checking' && (
              <Spinner className="size-3 text-muted-foreground/50" />
            )}
            {status === 'downloading' && (
              <Tooltip>
                <TooltipTrigger>
                  <RiDownloadLine className={`
                    size-3 animate-bounce text-muted-foreground/50
                  `}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  Downloading update...
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
