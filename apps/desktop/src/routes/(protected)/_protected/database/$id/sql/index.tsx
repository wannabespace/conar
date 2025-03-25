import type { editor } from 'monaco-editor'
import { Button } from '@connnect/ui/components/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@connnect/ui/components/resizable'
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
              onEnter={() => sendQuery()}
              className="size-full"
            />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel minSize={20}>
            {Array.isArray(result) && (
              <DataTable
                data={result}
                columns={columns}
                className="h-full"
              />
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
              : !result && (
                  <div className="h-full flex flex-col items-center justify-center">
                    <RiPlayLargeLine className="size-6 text-muted-foreground mb-2" />
                    <p className="text-center">
                      No results to display
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 text-center">
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
