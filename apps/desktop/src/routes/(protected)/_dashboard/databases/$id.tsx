import type { editor } from 'monaco-editor'
import { Button } from '@connnect/ui/components/button'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { Monaco } from '~/components/monaco'
import { formatSql } from '~/lib/formatter'
import { trpc } from '~/lib/trpc'

export const Route = createFileRoute('/(protected)/_dashboard/databases/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const [query, setQuery] = useState('')
  const { data: database } = useQuery({
    queryKey: ['databases', id],
    queryFn: () => trpc.databases.get.query({ id }),
  })
  // eslint-disable-next-line ts/no-explicit-any
  const [result, setResult] = useState<any>(null)
  const editorRef = useRef<editor.IStandaloneCodeEditor>(null)

  function format() {
    const formatted = formatSql(query, 'postgresql')

    setQuery(formatted)
    editorRef.current?.setValue(formatted)
  }

  function send(query: string) {
    if (!database)
      return

    window.electron.databases.postgresQuery({
      connection: {
        host: database.host,
        port: database.port,
        user: database.username,
        password: 'hXjwbSoyh8UsXhjn',
        database: database.database ?? undefined,
      },
      query,
    }).then((data) => {
      setResult(data)
    })
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
