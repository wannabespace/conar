import { ArrowRight02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import { Progress } from '@tamery/ui/components/progress'

import { ResourceLabel } from '~/core/connection/resource-label'

import type { CopyStatus } from './copy-progress'
import type { CopyEnd } from './target-select'

const PROGRESS_VALUES: Record<CopyStatus, number | null> = {
  copied: 100,
  copying: null,
  failed: 100,
  stopped: 0,
}

const PROGRESS_VARIANTS = {
  copied: 'success',
  copying: 'default',
  failed: 'destructive',
  stopped: 'default',
} as const satisfies Record<CopyStatus, string>

const RouteEnd = ({ connection, resource }: CopyEnd) => (
  <span
    data-mask
    className="bg-popover ring-foreground/4 flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3 py-2 ring"
  >
    <ConnectionIcon
      type={connection.type}
      provider={connection.provider}
      className="size-5 shrink-0"
    />
    <span className="flex min-w-0 flex-col">
      <span className="text-foreground truncate font-medium">
        {connection.name}
      </span>
      <span className="truncate text-xs">
        <ResourceLabel connection={connection} name={resource.name} />
      </span>
    </span>
  </span>
)

export const CopyRoute = ({
  source,
  status,
  target,
}: {
  source: CopyEnd
  status: CopyStatus
  target: CopyEnd
}) => (
  <span className="mt-3 flex flex-col gap-4">
    <span className="flex items-center gap-2">
      <RouteEnd {...source} />
      <HugeiconsIcon
        icon={ArrowRight02Icon}
        strokeWidth={2}
        className="text-muted-foreground size-4 shrink-0"
      />
      <RouteEnd {...target} />
    </span>
    <Progress
      aria-label="Copy progress"
      value={PROGRESS_VALUES[status]}
      variant={PROGRESS_VARIANTS[status]}
    />
  </span>
)
