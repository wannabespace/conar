import type { editor } from 'monaco-editor'
import { Button } from '@connnect/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { ScrollArea } from '@connnect/ui/components/scroll-area'
import { useLocalStorageValue } from '@react-hookz/web'
import { RiShining2Line } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useRef } from 'react'
import { Monaco } from '~/components/monaco'
import { PAGE_SCREEN_CLASS } from '~/constants'
import { DataTable, useConnection } from '~/entities/connection'
import { formatSql } from '~/lib/formatter'
import { SqlGenerator } from './-components/sql-generator'

export const Route = createFileRoute(
  '/(protected)/_dashboard/database/$id/sql',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { value: query, set: setQuery } = useLocalStorageValue(`sql-${id}`, {
    defaultValue: '',
    initializeWithValue: true,
  })
  const parentRef = useRef<HTMLDivElement>(null)
  const monacoRef = useRef<editor.IStandaloneCodeEditor>(null)
  const { data: connection } = useConnection(id)

  const { mutate: sendQuery, data: result, isPending } = useMutation({
    mutationFn: async (queryParam?: string | void) => {
      const response = await window.electron.databases.query({
        type: connection.type,
        connectionString: connection.connectionString,
        query: queryParam ?? query,
      })

      return response as Record<string, unknown>[]
    },
    // onError() {
    //   console.log('error')
    // }
  })

  function format() {
    if (!connection)
      return

    const formatted = formatSql(query, connection.type)

    setQuery(formatted)
  }

  const columns = (result && Array.isArray(result) && result.length > 0
    ? Object.keys(result[0] as Record<string, unknown>)
    : []).map(column => ({
    name: column,
  }))

  return (
    <Card>
      <ScrollArea scrollRef={parentRef} className={PAGE_SCREEN_CLASS}>
        <CardHeader>
          <CardTitle>SQL Runner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 justify-between">
            <SqlGenerator
              connection={connection}
              query={query}
              setQuery={(value) => {
                setQuery(value)
                monacoRef.current?.setValue(value)
              }}
              onSendQuery={sendQuery}
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
            className="h-[300px] border border-border rounded-lg overflow-hidden"
          />
          <div className="flex gap-2 justify-end">
            <Button
              loading={isPending}
              onClick={() => sendQuery()}
            >
              Run
            </Button>
          </div>
          {Array.isArray(result) && (
            <>
              {result.length > 0
                ? (
                    <DataTable
                      data={result}
                      columns={columns}
                    />
                  )
                : (
                    <div className="p-4 text-sm text-muted-foreground">
                      No results
                    </div>
                  )}
            </>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  )
}
