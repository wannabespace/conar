import type { editor } from 'monaco-editor'
import { Button } from '@connnect/ui/components/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@connnect/ui/components/resizable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@connnect/ui/components/tabs'
import { useLocalStorageValue } from '@react-hookz/web'
import { RiLoader4Line, RiPlayLargeLine, RiShining2Line } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useRef } from 'react'
import { toast } from 'sonner'
import { Monaco } from '~/components/monaco'
import { DataTable, useDatabase } from '~/entities/database'
import { formatSql } from '~/lib/formatter'
import { SqlChat } from './-components/sql-chat'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/sql/',
)({
  component: RouteComponent,
})

function ResultTable({ result, columns }: { result: Record<string, unknown>[], columns: string[] }) {
  return (
    <DataTable
      data={result}
      columns={columns.map(c => ({
        name: c,
      }))}
      className="h-full"
    />
  )
}

function RouteComponent() {
  const { id } = Route.useParams()
  const { value: query, set: setQuery } = useLocalStorageValue(`sql-${id}`, {
    defaultValue: '',
    initializeWithValue: true,
  })
  const monacoRef = useRef<editor.IStandaloneCodeEditor>(null)
  const { data: database } = useDatabase(id)

  const { mutate: sendQuery, data: results, isPending } = useMutation({
    mutationFn: () => window.electron.databases.query({
      type: database.type,
      connectionString: database.connectionString,
      query,
    }),
    onSuccess() {
      toast.success('Query executed successfully')
    },
    onError() {
      toast.error('Failed to execute query')
    },
  })

  function format() {
    const formatted = formatSql(query, database.type)

    setQuery(formatted)
    monacoRef.current?.setValue(formatted)
  }

  return (
    <ResizablePanelGroup autoSaveId="sql-layout-x" direction="horizontal" className="flex h-auto!">
      <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
        <SqlChat />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        minSize={30}
        maxSize={80}
        className="flex flex-col gap-4"
      >
        <ResizablePanelGroup autoSaveId="sql-layout-y" direction="vertical">
          <ResizablePanel minSize={20} className="relative">
            <div className="absolute right-6 bottom-2 z-10 flex gap-2">
              <Button
                variant="secondary"
                onClick={() => format()}
              >
                <RiShining2Line />
                Format
              </Button>
              <Button disabled={isPending} onClick={() => sendQuery()}>
                <RiPlayLargeLine />
                Run
              </Button>
            </div>
            <Monaco
              ref={monacoRef}
              initialValue={query}
              onChange={setQuery}
              className="size-full"
            />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel minSize={20}>
            {Array.isArray(results) && (
              <Tabs
                defaultValue="table-0"
                className="size-full gap-0"
              >
                {results.length > 1 && (
                  <TabsList className="rounded-none w-full bg-card">
                    {results.map((_, i) => (
                      <TabsTrigger key={i} value={`table-${i}`}>
                        Result
                        {' '}
                        {i + 1}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                )}
                {results.map((r, i) => (
                  <TabsContent className="h-full" key={i} value={`table-${i}`}>
                    <ResultTable result={r.rows} columns={r.columns} />
                  </TabsContent>
                ))}
              </Tabs>
            )}
            {isPending
              ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <RiLoader4Line className="size-6 text-muted-foreground mb-2 animate-spin" />
                    <p className="text-center">
                      Running query...
                    </p>
                  </div>
                )
              : !results && (
                  <div className="h-full flex flex-col items-center justify-center">
                    <p className="text-center">
                      No results to display
                    </p>
                    <p className="text-muted-foreground mt-1 text-center">
                      Write and run a SQL query above to see results here
                    </p>
                  </div>
                )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
