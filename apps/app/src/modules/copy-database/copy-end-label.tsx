import { ResourceLabel } from '~/core/connection/resource-label'
import type { Connection, ConnectionResource } from '~/core/connection/sync'

export interface CopyEnd {
  connection: Connection
  resource: ConnectionResource
}

export const CopyEndLabel = ({ connection, resource }: CopyEnd) => (
  <span data-mask className="min-w-0 truncate">
    {connection.name}
    <span className="text-muted-foreground"> / </span>
    <ResourceLabel connection={connection} name={resource.name} />
  </span>
)
