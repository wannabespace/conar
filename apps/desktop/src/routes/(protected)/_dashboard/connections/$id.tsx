import type { editor } from 'monaco-editor'
import { Button } from '@connnect/ui/components/button'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '@connnect/ui/components/command'
import { useKeyboardEvent } from '@react-hookz/web'
import { RiAddLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { ConnectionIcon } from '~/components/connection-icon'
import { Monaco } from '~/components/monaco'
import { useConnection, useConnections } from '~/entities/connection'
import { formatSql } from '~/lib/formatter'

export const Route = createFileRoute('/(protected)/_dashboard/connections/$id')({
  component: RouteComponent,
})

function Connections({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const { data: connections } = useConnections()

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a connection name..." />
      <CommandList>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => setOpen(false)}>
            <RiAddLine className="size-4 shrink-0 opacity-60" />
            Add New Connection...
          </CommandItem>
        </CommandGroup>
        <CommandEmpty>No connections found.</CommandEmpty>
        <CommandGroup heading="Connections">
          {connections?.map(connection => (
            <CommandItem key={connection.id}>
              <ConnectionIcon type={connection.type} className="size-4 shrink-0 opacity-60" />
              {connection.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

function ConnectionName({ id }: { id: string }) {
  const [openConnections, setOpenConnections] = useState(false)
  const { data: connection } = useConnection(id)
  const { data: connections } = useConnections()

  useKeyboardEvent(e => e.key === 'l' && e.metaKey, () => {
    if (!connections || connections.length === 0)
      return

    setOpenConnections(open => !open)
  })

  return (
    <>
      <Connections open={openConnections} setOpen={setOpenConnections} />
      {connection && (
        <button
          type="button"
          className="flex items-center py-1 gap-2 font-medium rounded-md text-sm cursor-pointer"
          onClick={() => setOpenConnections(true)}
        >
          <ConnectionIcon type={connection.type} className="size-4" />
          {connection.name}
          <CommandShortcut>⌘L</CommandShortcut>
        </button>
      )}
    </>
  )
}

function RouteComponent() {
  const { id } = Route.useParams()
  const [query, setQuery] = useState('')
  const { data: connection } = useConnection(id)

  const editorRef = useRef<editor.IStandaloneCodeEditor>(null)
  const { mutate: sendQuery, data: result, isPending } = useMutation({
    mutationFn: async () => {
      if (!connection)
        return

      return await window.electron.connections.query({
        type: connection.type,
        connectionString: connection.connectionString,
        query,
      })
    },
  })

  function format() {
    if (!connection)
      return

    const formatted = formatSql(query, connection.type)

    setQuery(formatted)
    editorRef.current!.setValue(formatted)
  }

  return (
    <div>
      <ConnectionName id={id} />
      <Button onClick={() => format()}>Format</Button>
      <Monaco ref={editorRef} initialValue={query} onChange={setQuery} />
      <Button
        loading={isPending}
        onClick={() => sendQuery()}
      >
        Query
      </Button>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  )
}
