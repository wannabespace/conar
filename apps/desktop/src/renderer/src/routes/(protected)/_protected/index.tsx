import { SOCIAL_LINKS } from '@conar/shared/constants'
import { title } from '@conar/shared/utils/title'
import { Button } from '@conar/ui/components/button'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Separator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { RiAddLine, RiCheckLine, RiDownloadLine, RiGithubLine, RiGlobalLine, RiLoader4Line, RiLoopLeftLine, RiTwitterXLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { syncDatabases } from '~/entities/database'
import { checkForUpdates, updatesStore } from '~/updates-observer'
import { DatabasesList } from './-components/databases-list'
import { Profile } from './-components/profile'

export const Route = createFileRoute('/(protected)/_protected/')({
  component: DashboardPage,
  head: () => ({
    meta: [
      {
        title: title('Dashboard'),
      },
    ],
  }),
})

function DashboardPage() {
  const { mutate: refetch, isPending: isRefetching } = useMutation({
    mutationFn: syncDatabases,
  })
  const router = useRouter()
  const [version, status] = useStore(updatesStore, state => [state.version, state.status])

  return (
    <div className="min-h-screen flex flex-col px-6 mx-auto max-w-2xl py-10">
      <h1 className="scroll-m-20 mb-6 text-4xl font-extrabold tracking-tight lg:text-5xl">
        Dashboard
      </h1>
      <Profile className="mb-8" />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl lg:text-4xl font-bold">
          Connections
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={isRefetching}
            onClick={() => refetch()}
          >
            <LoadingContent loading={isRefetching}>
              <ContentSwitch active={isRefetching} activeContent={<RiCheckLine className="text-success" />}>
                <RiLoopLeftLine />
              </ContentSwitch>
            </LoadingContent>
          </Button>
          <Button onClick={() => router.navigate({ to: '/create' })}>
            <RiAddLine className="size-4" />
            Add new
          </Button>
        </div>
      </div>
      <DatabasesList />
      <div className="mt-auto pt-6">
        <Separator />
        <div className="mt-3 flex gap-2 items-center">
          <a
            href="https://conar.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground/50 p-1 hover:text-muted-foreground/70 transition-colors"
          >
            <RiGlobalLine className="size-4" />
          </a>
          <a
            href={SOCIAL_LINKS.TWITTER}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground/50 p-1 hover:text-muted-foreground/70 transition-colors"
          >
            <RiTwitterXLine className="size-4" />
          </a>
          <a
            href={SOCIAL_LINKS.GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground/50 p-1 hover:text-muted-foreground/70 transition-colors"
          >
            <RiGithubLine className="size-4" />
          </a>
          <Separator orientation="vertical" className="h-4!" />
          <button
            type="button"
            onClick={() => checkForUpdates()}
            className="cursor-pointer text-xs text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors"
          >
            Current version
            {' '}
            v
            {version}
          </button>
          {' '}
          {status === 'checking' && <RiLoader4Line className="size-3 animate-spin text-muted-foreground/50" />}
          {status === 'downloading' && (
            <Tooltip>
              <TooltipTrigger>
                <RiDownloadLine className="size-3 animate-bounce text-muted-foreground/50" />
              </TooltipTrigger>
              <TooltipContent>
                Downloading update...
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  )
}
