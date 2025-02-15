import type { editor } from 'monaco-editor'
import { Button } from '@connnect/ui/components/button'
import { useQuery } from '@tanstack/react-query'
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
  const { data: connection } = useQuery(connectionQuery(id))
  // eslint-disable-next-line ts/no-explicit-any
  const [result, setResult] = useState<any>(null)
  const editorRef = useRef<editor.IStandaloneCodeEditor>(null)

  function format() {
    const formatted = formatSql(query, 'postgresql')

    setQuery(formatted)
    editorRef.current?.setValue(formatted)
  }

  function send(query: string) {
    if (!connection)
      return

    window.electron.connections
      .query({
        type: connection.type,
        connectionString: connection.connectionString,
        query,
      })
      .then(setResult)
  }
  return (
    <div>
      <Button onClick={() => format()}>Format</Button>
      <Monaco ref={editorRef} initialValue={query} onChange={setQuery} />
      <Button onClick={() => send(query)}>Query</Button>
      <pre>{JSON.stringify(result?.rows, null, 2)}</pre>
    </div>
  )
}
