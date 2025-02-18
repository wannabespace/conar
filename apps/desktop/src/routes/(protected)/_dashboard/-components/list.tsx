import type { RouterOutputs } from '@connnect/web/trpc-type'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@connnect/ui/components/dropdown-menu'
import { Input } from '@connnect/ui/components/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@connnect/ui/components/select'
import { RiDeleteBinLine, RiMoreLine } from '@remixicon/react'
import { Link } from '@tanstack/react-router'
import { ConnectionIcon } from '~/components/connection-icon'
import { queryClient } from '~/main'
import { connectionQuery } from '~/queries/connections'

function ConnectionCard({ connection }: { connection: RouterOutputs['connections']['list'][number] }) {
  return (
    <Link
      className="relative flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-5 transition-all duration-100 hover:border-primary/20 hover:bg-element hover:shadow-lg shadow-black/3"
      to="/connections/$id"
      params={{ id: connection.id }}
      onMouseOver={() => queryClient.prefetchQuery(connectionQuery(connection.id))}
    >
      <div className="size-14 shrink-0 rounded-full border border-border bg-accent p-3">
        <ConnectionIcon type={connection.type} className="size-full text-primary" />
      </div>
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="font-medium tracking-tight truncate">{connection.name}</div>
        <div className="text-sm text-muted-foreground truncate">{connection.connectionString.replaceAll('*', '•')}</div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-md p-2 hover:bg-accent-foreground/5">
          <RiMoreLine className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled className="text-destructive focus:text-destructive">
            <RiDeleteBinLine className="mr-2 size-4" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Link>
  )
}

export function List({ connections }: { connections: RouterOutputs['connections']['list'] }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1">
          <Select>
            <SelectTrigger disabled className="w-[150px]">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Fruits</SelectLabel>
                <SelectItem value="apple">Apple</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <Input disabled className="flex-1" placeholder="Search" />
      </div>
      <div className="flex flex-col gap-2">
        {connections.map(connection => (
          <ConnectionCard key={connection.id} connection={connection} />
        ))}
      </div>
    </div>
  )
}
