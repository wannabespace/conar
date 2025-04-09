import { title } from '@connnect/shared/utils/title'
import { Button } from '@connnect/ui/components/button'
import { LoadingContent } from '@connnect/ui/components/custom/loading-content'
import { DotPattern } from '@connnect/ui/components/magicui/dot-pattern'
import { Separator } from '@connnect/ui/components/separator'
import { RiAddLine, RiDownloadLine, RiLoader4Line, RiLoopLeftLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { fetchDatabases } from '~/entities/database'
import { useUpdates } from '~/updates-provider'
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
    mutationFn: fetchDatabases,
  })
  const router = useRouter()
  const { version, status, checkForUpdates } = useUpdates()

  return (
    <div className="flex flex-col w-full mx-auto max-w-2xl py-10">
      <DotPattern
        width={20}
        height={20}
        className="absolute -z-10 top-0 left-0 [mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)]"
      />
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
              <RiLoopLeftLine />
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
          {status === 'downloading' && <RiDownloadLine className="size-3 animate-bounce text-muted-foreground/50" />}
        </div>
      </div>
    </div>
  )
}
