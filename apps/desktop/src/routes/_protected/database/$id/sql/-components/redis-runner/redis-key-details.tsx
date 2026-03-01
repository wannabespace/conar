import type { KeyDetails } from './lib/types'
import { Badge } from '@conar/ui/components/badge'
import { Separator } from '@conar/ui/components/separator'
import { Skeleton } from '@conar/ui/components/skeleton'
import { RedisValueViewer } from './redis-value-viewer'

const TTL_NO_EXPIRY = -1

export function RedisKeyDetails({
  selectedKey,
  keyDetails,
  keyDetailsLoading,
}: {
  selectedKey: string
  keyDetails: KeyDetails | null | undefined
  keyDetailsLoading: boolean
}) {
  return (
    <div
      className="rounded-lg border p-4"
    >
      <div className="
        mb-3 flex items-center gap-2 font-mono text-sm font-medium
      "
      >
        {selectedKey}
        {!keyDetailsLoading && keyDetails && (
          <Badge variant="outline" className="font-mono text-xs">{keyDetails.type}</Badge>
        )}
      </div>
      {keyDetailsLoading
        ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          )
        : keyDetails && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">TTL</span>
              <Badge
                variant={keyDetails.ttl === TTL_NO_EXPIRY ? 'secondary' : 'outline'}
                className="font-mono"
              >
                {keyDetails.ttl === TTL_NO_EXPIRY ? 'no expiry' : `${keyDetails.ttl}s`}
              </Badge>
            </div>
            <Separator />
            <div>
              <span className="mb-1.5 block text-muted-foreground">Value</span>
              <RedisValueViewer type={keyDetails.type} value={keyDetails.value} />
            </div>
          </div>
        )}
    </div>
  )
}
