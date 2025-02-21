import type { RouterOutputs } from '@connnect/web/trpc-type'
import { Button } from '@connnect/ui/components/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@connnect/ui/components/dropdown-menu'
import { Input } from '@connnect/ui/components/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@connnect/ui/components/select'
import { RiDeleteBinLine, RiMoreLine } from '@remixicon/react'
import { Link, useRouter } from '@tanstack/react-router'
import { useMemo } from 'react'
import { ConnectionIcon } from '~/components/connection-icon'
import { connectionQuery, useConnections } from '~/entities/connection'
import { queryClient } from '~/main'

function ConnectionCard({ connection }: { connection: RouterOutputs['connections']['list'][number] }) {
  const connectionString = useMemo(() => {
    const url = new URL(connection.connectionString)

    if (url.password) {
      url.password = '•'.repeat(url.password.length)
    }

    return url.toString()
  }, [connection.connectionString])

  return (
    <Link
      className="relative flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-5 transition-all duration-150 hover:border-primary/20 hover:bg-element hover:shadow-lg shadow-black/3"
      to="/connections/$id"
      params={{ id: connection.id }}
      onMouseOver={() => queryClient.prefetchQuery(connectionQuery(connection.id))}
    >
      <div className="size-14 shrink-0 rounded-full border border-border bg-accent p-3">
        <ConnectionIcon type={connection.type} className="size-full text-primary" />
      </div>
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="font-medium tracking-tight truncate">{connection.name}</div>
        <div className="text-sm text-muted-foreground truncate">{connectionString}</div>
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

export function Empty() {
  const router = useRouter()

  return (
    <div className="text-center bg-background border-2 border-dashed border-foreground/10 rounded-xl p-14 w-full m-auto group">
      <h2 className="text-foreground font-medium mt-6">
        No connections found
      </h2>
      <p className="text-sm text-muted-foreground mt-1 mb-4 whitespace-pre-line">
        Create a new connection to get started.
      </p>
      <Button onClick={() => router.navigate({ to: '/create' })}>
        Create a new connection
      </Button>
    </div>
  )
}

export function List() {
  const { data: connections } = useConnections()

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
        {connections?.length
          ? (
              connections?.map(connection => (
                <ConnectionCard key={connection.id} connection={connection} />
              ))
            )
          : <Empty />}
      </div>
    </div>
  )
}
