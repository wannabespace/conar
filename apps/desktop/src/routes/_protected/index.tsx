import { SOCIAL_LINKS } from '@conar/shared/constants'
import { title } from '@conar/shared/utils/title'
import { Button } from '@conar/ui/components/button'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Separator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { RiAddLine, RiCheckLine, RiDiscordLine, RiDownloadLine, RiGithubLine, RiGlobalLine, RiLoader4Line, RiLoopLeftLine, RiTwitterXLine } from '@remixicon/react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useDatabasesSync } from '~/entities/database/sync'
import { checkForUpdates, updatesStore } from '~/use-updates-observer'
import { DatabasesList } from './-components/databases-list'
import { Profile } from './-components/profile'

export const Route = createFileRoute('/_protected/')({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: title('Dashboard') }],
  }),
})

function DashboardPage() {
  const { sync, isSyncing } = useDatabasesSync()
  const [version, versionStatus] = useStore(updatesStore, state => [state.version, state.status])

  return (
    <ScrollArea className="overflow-auto">
      <div className="mx-auto flex size-full max-w-3xl flex-col px-6 py-10">
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
            <Button
              variant="outline"
              size="icon"
              disabled={isSyncing}
              onClick={() => sync()}
            >
              <LoadingContent loading={isSyncing}>
                <ContentSwitch
                  active={isSyncing}
                  activeContent={(
                    <RiCheckLine className="text-success" />
                  )}
                >
                  <RiLoopLeftLine />
                </ContentSwitch>
              </LoadingContent>
            </Button>
            <Button asChild>
              <Link to="/create">
                <RiAddLine className="size-4" />
                Add new
              </Link>
            </Button>
          </div>
        </div>
        <DatabasesList />
        <div className="mt-auto py-6">
          <Separator />
          <div className="mt-3 flex items-center gap-2">
            <a
              href="https://conar.app"
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
            {versionStatus === 'checking' && (
              <RiLoader4Line className={`
                size-3 animate-spin text-muted-foreground/50
              `}
              />
            )}
            {versionStatus === 'downloading' && (
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
