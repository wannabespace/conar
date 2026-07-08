import { RiAddLine, RiArrowRightUpLine, RiDiscordLine, RiDownloadLine, RiGithubLine, RiGlobalLine, RiTwitterXLine } from '@remixicon/react'
import { SOCIAL_LINKS } from '@tamery/shared/constants'
import { connectionLabels } from '@tamery/shared/enums/connection-type'
import { pick } from '@tamery/shared/utils/helpers'
import { title } from '@tamery/shared/utils/title'
import { Badge } from '@tamery/ui/components/badge'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { Separator } from '@tamery/ui/components/separator'
import { Spinner } from '@tamery/ui/components/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSubscription } from 'seitu/react'
import { useCollections } from '~/entities/collections'
import { ConnectionIcon, ConnectionResourceLink } from '~/entities/connection'
import { checkForUpdates, updatesStore } from '~/use-updates-observer'

export const Route = createFileRoute('/_protected/')({
  component: HomePage,
  head: () => ({
    meta: [{ title: title('Home') }],
  }),
})

// eslint-disable-next-line react-refresh/only-export-components
function ConnectionsGrid() {
  const { connectionsCollection, connectionsResourcesCollection, connectionStringsCollection } = useCollections()
  const { data } = useLiveQuery(q => q
    .from({ c: connectionsCollection })
    .innerJoin(
      { r: connectionsResourcesCollection },
      ({ c, r }) => eq(r.connectionId, c.id),
    )
    .leftJoin(
      { cs: connectionStringsCollection },
      ({ c, cs }) => eq(cs.connectionId, c.id),
    )
    .select(({ c, r, cs }) => ({ connection: c, resource: r, connectionString: cs }))
    .orderBy(({ c }) => c.createdAt, 'desc'), [connectionsCollection, connectionsResourcesCollection, connectionStringsCollection])

  const seen = new Set<string>()
  const tiles = data.filter(({ connection }) => {
    if (seen.has(connection.id))
      return false
    seen.add(connection.id)
    return true
  })

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3">
      {tiles.map(({ connection, resource, connectionString }) => (
        <ConnectionResourceLink
          key={connection.id}
          resourceId={resource.id}
          style={{ '--color': connection.color ?? 'var(--primary)' }}
          className={cn(`
            group relative flex flex-col gap-3 overflow-hidden rounded-lg border
            bg-card p-4 pl-5 transition-all
            hover:-translate-y-0.5 hover:border-(--color) hover:shadow-sm
          `)}
        >
          {/* Color spine — the connection's own identity */}
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-1 bg-(--color)"
          />
          <div className="flex items-start gap-3">
            <ConnectionIcon type={connection.type} className="size-7 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm/tight font-medium">
                {connection.name}
              </span>
              <span className="
                text-[0.7rem] tracking-wide text-muted-foreground uppercase
              "
              >
                {connectionLabels[connection.type]}
              </span>
            </div>
            {connection.label && (
              <Badge variant="secondary" className="max-w-20 shrink-0 truncate">
                {connection.label}
              </Badge>
            )}
          </div>
          <span className="truncate font-mono text-xs text-muted-foreground/80">
            {connectionString?.displayUrl ?? '—'}
          </span>
          <RiArrowRightUpLine className="
            absolute right-3 bottom-3 size-4 text-muted-foreground opacity-0
            transition-opacity
            group-hover:opacity-100
          "
          />
        </ConnectionResourceLink>
      ))}
      <Link
        to="/create"
        className={`
          flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg
          border border-dashed border-border/60 text-muted-foreground
          transition-colors
          hover:border-primary/40 hover:bg-accent/50 hover:text-foreground
        `}
      >
        <RiAddLine className="size-6" />
        <span className="text-sm font-medium">Add new connection</span>
      </Link>
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
function HomePage() {
  const { version, status } = useSubscription(updatesStore, { selector: state => pick(state, ['version', 'status']) })

  return (
    <ScrollArea className="overflow-auto">
      <div className="mx-auto flex size-full max-w-4xl flex-col px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Connections
          </h1>
          <p className="text-sm text-muted-foreground">
            Pick a connection to open, or add a new one.
          </p>
        </div>
        <ConnectionsGrid />
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
