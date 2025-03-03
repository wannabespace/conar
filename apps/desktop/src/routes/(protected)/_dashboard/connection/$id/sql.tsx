import type { editor } from 'monaco-editor'
import { Button } from '@connnect/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { Input } from '@connnect/ui/components/input'
import { RiSparklingLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { Monaco } from '~/components/monaco'
import { useConnection } from '~/entities/connection'
import { formatSql } from '~/lib/formatter'
import { trpc } from '~/trpc'

export const Route = createFileRoute(
  '/(protected)/_dashboard/connection/$id/sql',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const [query, setQuery] = useState('')
  const { data: connection } = useConnection(id)
  const [generateSqlPrompt, setGenerateSqlPrompt] = useState('')

  const editorRef = useRef<editor.IStandaloneCodeEditor>(null)
  const { mutate: sendQuery, data: result, isPending } = useMutation({
    mutationFn: async () => {
      if (!connection)
        return

      return window.electron.connections.query({
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

  const { mutate: generateSql, isPending: isGeneratingSql } = useMutation({
    mutationFn: async () => {
      if (!connection)
        return null!

      return trpc.ai.generateSql.mutate({
        type: connection.type,
        prompt: generateSqlPrompt,
        context: query,
      })
    },
    onSuccess: (data) => {
      setQuery(data)
      editorRef.current!.setValue(data)

      if (data.includes('DELETE') || data.includes('UPDATE') || data.includes('INSERT') || data.includes('CREATE') || data.includes('DROP'))
        return

      sendQuery()
    },
  })

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>SQL Runner</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={() => format()}>Format</Button>
        <Monaco ref={editorRef} initialValue={query} onChange={setQuery} />
        <Button
          loading={isPending}
          onClick={() => sendQuery()}
        >
          Query
        </Button>
        <form onSubmit={(e) => {
          e.preventDefault()
          generateSql()
        }}
        >
          <div className="relative">
            <RiSparklingLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Generate SQL query using natural language"
              value={generateSqlPrompt}
              onChange={e => setGenerateSqlPrompt(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            type="submit"
            loading={isGeneratingSql}
          >
            Generate SQL
          </Button>
        </form>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </CardContent>
    </Card>
  )
}
