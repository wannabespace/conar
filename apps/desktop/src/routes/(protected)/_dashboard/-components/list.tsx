import type { ConnectionType } from '@connnect/shared/enums/connection-type'
import type { RouterOutputs } from '@connnect/web/trpc-type'
import { connectionLabels } from '@connnect/shared/enums/connection-type'
import { Card, CardContent, CardHeader } from '@connnect/ui/components/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@connnect/ui/components/dropdown-menu'
import { RiDeleteBinLine, RiMoreLine } from '@remixicon/react'
import { useRouter } from '@tanstack/react-router'
import { ConnectionIcon } from '~/components/connection-icon'

function ConnectionCard({ connection }: { connection: RouterOutputs['connections']['list'][number] }) {
  const router = useRouter()

  return (
    <Card
      className="flex items-center cursor-pointer justify-between hover:bg-accent"
      onClick={() => router.navigate({ to: '/connections/$id', params: { id: connection.id } })}
    >
      <CardHeader className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">{connection.name}</div>
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 hover:bg-accent-foreground/5 rounded-md">
            <RiMoreLine className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <RiDeleteBinLine className="mr-2 size-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {connection.createdAt.toLocaleDateString()}
      </CardContent>
    </Card>
  )
}

export function List({ connections }: { connections: RouterOutputs['connections']['list'] }) {
  const groupedConnections = Object.groupBy(connections, c => c.type)
  const entries = Object.entries(groupedConnections) as [ConnectionType, RouterOutputs['connections']['list']][]

  return (
    <div>
      <div>
        {entries.map(([type, connections]) => (
          <div key={type}>
            <h2 className="text-lg font-medium flex items-center gap-2 mb-4">
              <ConnectionIcon type={type} className="size-6" />
              {connectionLabels[type]}
            </h2>
            <div className="flex flex-col gap-2">
              {connections.map(connection => (
                <ConnectionCard key={connection.id} connection={connection} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
