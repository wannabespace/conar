import { getOS } from '@connnect/shared/utils/os'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@connnect/ui/components/alert-dialog'
import { Button } from '@connnect/ui/components/button'
import { CardHeader, CardTitle } from '@connnect/ui/components/card'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@connnect/ui/components/resizable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@connnect/ui/components/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { copy } from '@connnect/ui/lib/copy'
import { RiFileCopyLine, RiLoader4Line, RiPlayLargeLine, RiShining2Line } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Monaco } from '~/components/monaco'
import { DANGEROUS_SQL_KEYWORDS } from '~/constants'
import { DataTable, useDatabase } from '~/entities/database'
import { formatSql } from '~/lib/formatter'
import { SqlChat } from './-components/sql-chat'

const os = getOS()

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

const queryStorage = {
  get(id: string) {
    return localStorage.getItem(`sql-${id}`) || '-- Write your SQL query here\n'
      + '\n'
      + '-- Examples:\n'
      + '-- Basic query with limit\n'
      + 'SELECT * FROM users LIMIT 10;\n'
      + '\n'
      + '-- Query with filtering\n'
      + 'SELECT id, name, email FROM users WHERE created_at > \'2023-01-01\' ORDER BY name;\n'
      + '\n'
      + '-- Join example\n'
      + 'SELECT u.id, u.name, p.title FROM users u\n'
      + 'JOIN posts p ON u.id = p.user_id\n'
      + 'WHERE p.published = true\n'
      + 'LIMIT 10;\n'
      + '\n'
      + '-- You can run multiple queries at once by separating them with semicolons'
  },
  set(id: string, query: string) {
    localStorage.setItem(`sql-${id}`, query)
  },
}

function DangerousSqlAlert({ open, setOpen, confirm }: { open: boolean, setOpen: (open: boolean) => void, confirm: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Potentially Dangerous SQL Query</AlertDialogTitle>
          <AlertDialogDescription>
            Your query contains potentially dangerous SQL keywords that could modify or delete data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirm}>
            Run Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function RouteComponent() {
  const { id } = Route.useParams()
  const [query, setQuery] = useState(queryStorage.get(id))
  const { data: database } = useDatabase(id)

  useEffect(() => {
    queryStorage.set(id, query)
  }, [id, query])

  const { mutate, data: results, isPending } = useMutation({
    mutationFn: () => window.electron.databases.query({
      type: database.type,
      connectionString: database.connectionString,
      query,
    }),
    onSuccess() {
      toast.success('Query executed successfully')
    },
    onError(error) {
      toast.error(error.message)
    },
  })

  const [isAlertVisible, setIsAlertVisible] = useState(false)

  function sendQuery() {
    if (DANGEROUS_SQL_KEYWORDS.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      setIsAlertVisible(true)
      return
    }

    mutate()
  }

  function format() {
    const formatted = formatSql(query, database.type)

    setQuery(formatted)
    toast.success('Query formatted successfully')
  }

  return (
    <ResizablePanelGroup autoSaveId="sql-layout-x" direction="horizontal" className="flex h-auto!">
      <ResizablePanel defaultSize={30} minSize={20} maxSize={50} className="bg-muted/20">
        <SqlChat onEdit={setQuery} />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        minSize={30}
        maxSize={80}
        className="flex flex-col gap-4"
      >
        <ResizablePanelGroup autoSaveId="sql-layout-y" direction="vertical">
          <ResizablePanel minSize={20} className="relative">
            <DangerousSqlAlert
              open={isAlertVisible}
              setOpen={setIsAlertVisible}
              confirm={() => mutate()}
            />
            <CardHeader className="dark:bg-input/30 py-3">
              <CardTitle>
                SQL Runner
              </CardTitle>
            </CardHeader>
            <Monaco
              language="sql"
              value={query}
              onChange={setQuery}
              className="size-full"
              onEnter={() => sendQuery()}
            />
            <div className="absolute right-6 bottom-2 z-10 flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => copy(query)}
                    >
                      <RiFileCopyLine />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Copy
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                variant="secondary"
                onClick={() => format()}
              >
                <RiShining2Line />
                Format
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button disabled={isPending} onClick={() => sendQuery()}>
                      <RiPlayLargeLine />
                      Run
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {os === 'macos' ? '⌘' : 'Ctrl'}
                    {' '}
                    + Enter
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel minSize={20}>
            {Array.isArray(results) && (
              <Tabs
                defaultValue="table-0"
                className="size-full gap-0"
              >
                {results.length > 1 && (
                  <TabsList className="rounded-none w-full bg-muted/20">
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
                    <ResultTable
                      result={r.rows}
                      columns={r.columns}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            )}
            {isPending
              ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <RiLoader4Line className="size-6 text-muted-foreground mb-2 animate-spin" />
                    <p className="text-sm text-center">
                      Running query...
                    </p>
                  </div>
                )
              : !results && (
                  <div className="h-full flex flex-col items-center justify-center">
                    <p className="text-center">
                      No results to display
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 text-center">
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
