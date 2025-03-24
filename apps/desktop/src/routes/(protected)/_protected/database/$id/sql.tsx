import type { editor } from 'monaco-editor'
import { Button } from '@connnect/ui/components/button'
import { CardContent, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { LoadingContent } from '@connnect/ui/components/custom/loading-content'
import { ScrollArea } from '@connnect/ui/components/scroll-area'
import { useLocalStorageValue } from '@react-hookz/web'
import { RiShining2Line } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useRef } from 'react'
import { toast } from 'sonner'
import { Monaco } from '~/components/monaco'
import { DataTable, useDatabase } from '~/entities/database'
import { formatSql } from '~/lib/formatter'
import { SqlGenerator } from './-components/sql-generator'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/sql',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { value: query, set: setQuery } = useLocalStorageValue(`sql-${id}`, {
    defaultValue: '',
    initializeWithValue: true,
  })
  const monacoRef = useRef<editor.IStandaloneCodeEditor>(null)
  const { data: database } = useDatabase(id)

  const { mutate: sendQuery, data: result, isPending } = useMutation({
    mutationFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const response = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query,
      })

      return response as Record<string, unknown>[]
    },
    onSuccess() {
      toast.success('Query executed successfully')
    },
  })

  function format() {
    const formatted = formatSql(query, database.type)

    setQuery(formatted)
    monacoRef.current?.setValue(formatted)
  }

  const columns = (result && Array.isArray(result) && result.length > 0
    ? Object.keys(result[0] as Record<string, unknown>)
    : []).map(column => ({
    name: column,
  }))

  return (
    <ScrollArea className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle>SQL Runner</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 justify-between">
          <SqlGenerator
            database={database}
            query={query}
            setQuery={(value) => {
              setQuery(value)
              monacoRef.current?.setValue(value)
            }}
          />
          <Button
            variant="outline"
            onClick={() => format()}
          >
            <RiShining2Line />
            Format
          </Button>
        </div>
        <Monaco
          ref={monacoRef}
          initialValue={query}
          onChange={setQuery}
          onEnter={() => sendQuery()}
          className="border h-[40vh] rounded-lg overflow-hidden"
        />
        <div className="flex gap-2 justify-end">
          <Button onClick={() => sendQuery()}>
            <LoadingContent loading={isPending}>
              Run
            </LoadingContent>
          </Button>
        </div>
        {Array.isArray(result) && (
          <DataTable
            data={result}
            columns={columns}
          />
        )}
        {!result && (
          <div className="flex items-center justify-center">
            <p className="text-muted-foreground">
              No results
            </p>
          </div>
        )}
      </CardContent>
    </ScrollArea>
  )
}
