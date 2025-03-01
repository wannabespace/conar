import type { editor } from 'monaco-editor'
import { Button } from '@connnect/ui/components/button'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { Monaco } from '~/components/monaco'
import { useConnection } from '~/entities/connection'
import { formatSql } from '~/lib/formatter'
import { PasswordForm } from './-components/password-form'

export const Route = createFileRoute('/(protected)/_dashboard/connections/$id')({
  component: RouteComponent,
})

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

  if (!connection) {
    return (
      <div className="flex w-full items-center justify-center">
        <p className="text-lg font-medium text-muted-foreground">Loading connection...</p>
      </div>
    )
  }

  if (connection.isPasswordExists && !connection.isPasswordPopulated) {
    return <PasswordForm connection={connection} />
  }

  return (
    <div>
      <Button variant="outline" onClick={() => format()}>Format</Button>
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
