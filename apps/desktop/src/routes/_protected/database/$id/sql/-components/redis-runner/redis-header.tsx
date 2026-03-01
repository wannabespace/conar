import type { Connection } from './lib/types'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { Skeleton } from '@conar/ui/components/skeleton'
import { ConnectionIcon } from '~/entities/connection/components'

export function RedisHeader({
  connection,
  info,
  infoLoading,
}: {
  connection: Connection
  info: { dbsize: number, usedMemory: string } | undefined
  infoLoading: boolean
}) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
      <div className="flex min-w-0 items-center gap-2">
        <ConnectionIcon
          type={ConnectionType.Redis}
          className="size-5 shrink-0 text-muted-foreground"
        />
        <span className="truncate font-medium">{connection.name ?? 'Redis'}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
        {infoLoading ? <Skeleton className="h-4 w-16" /> : `${info?.dbsize ?? '-'} keys`}
        {infoLoading ? <Skeleton className="h-4 w-12" /> : `· ${info?.usedMemory ?? '-'}`}
      </div>
    </div>
  )
}
