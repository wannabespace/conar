import type { editor } from 'monaco-editor'
import { Button } from '@connnect/ui/components/button'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { Monaco } from '~/components/monaco'
import { formatSql } from '~/lib/formatter'
import { connectionQuery } from '~/queries/connections'

export const Route = createFileRoute('/(protected)/_dashboard/connections/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const [query, setQuery] = useState('')
  const { data: connection } = useSuspenseQuery(connectionQuery(id))
  const editorRef = useRef<editor.IStandaloneCodeEditor>(null)
  const { mutate: sendQuery, data: result, isPending } = useMutation({
    mutationFn: async () => {
      return await window.electron.connections.query({
        type: connection!.type,
        connectionString: connection!.connectionString,
        query,
      })
    },
  })

  function format() {
    const formatted = formatSql(query, connection!.type)

    setQuery(formatted)
    editorRef.current!.setValue(formatted)
  }

  return (
    <div>
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
