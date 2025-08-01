import type { editor } from 'monaco-editor'
import { getOS } from '@conar/shared/utils/os'
import { Button } from '@conar/ui/components/button'
import { CardHeader, CardTitle } from '@conar/ui/components/card'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@conar/ui/components/resizable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@conar/ui/components/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { copy } from '@conar/ui/lib/copy'
import { RiBrush2Line, RiCommandLine, RiCornerDownLeftLine, RiDeleteBin5Line, RiFileCopyLine, RiLoader4Line } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Monaco } from '~/components/monaco'
import { hasDangerousSqlKeywords, useDatabase } from '~/entities/database'
import { formatSql } from '~/lib/formatter'
import { dbQuery } from '~/lib/query'
import { chatQuery } from '../-chat'
import { pageHooks, pageStore } from '../-lib'
import { Route } from '../{-$chatId}'
import { RunnerAlertDialog } from './runner-alert-dialog'
import { RunnerTable } from './runner-table'

const os = getOS(navigator.userAgent)

export function Runner() {
  const { id } = Route.useParams()
  const { data: database } = useDatabase(id)
  const monacoRef = useRef<editor.IStandaloneCodeEditor>(null)
  const query = useStore(pageStore, state => state.query)

  useEffect(() => {
    return pageHooks.hook('focusRunner', () => {
      monacoRef.current?.focus()
    })
  }, [])

  useMountedEffect(() => {
    chatQuery.set(id, query)
  }, [id, query])

  const { refetch: runQuery, data: results, status, fetchStatus: queryStatus, error } = useQuery({
    queryKey: ['sql', id],
    queryFn: async () => {
      const result = await dbQuery({
        type: database.type,
        connectionString: database.connectionString,
        query,
      })

      toast.success('SQL executed successfully')

      return result
    },
    throwOnError: false,
    enabled: false,
  })

  useEffect(() => {
    if (status === 'error') {
      toast.error(error.message, {
        action: {
          label: 'Fix with AI',
          onClick: () => {
            pageHooks.callHook('fix', error.message)
          },
        },
        duration: 5000,
      })
    }
  }, [error, status])

  const [isAlertVisible, setIsAlertVisible] = useState(false)

  function sendQuery(query: string) {
    if (hasDangerousSqlKeywords(query)) {
      setIsAlertVisible(true)
      return
    }

    runQuery()
  }

  function format() {
    const formatted = formatSql(query, database.type)

    pageStore.setState(state => ({
      ...state,
      query: formatted,
    }))
    toast.success('SQL formatted successfully')
  }

  return (
    <ResizablePanelGroup autoSaveId="sql-layout-y" direction="vertical">
      <ResizablePanel minSize={20} className="relative">
        <RunnerAlertDialog
          query={query}
          open={isAlertVisible}
          setOpen={setIsAlertVisible}
          confirm={() => runQuery()}
        />
        <CardHeader className="bg-card py-3">
          <CardTitle className="flex items-center gap-2">
            SQL Runner
          </CardTitle>
        </CardHeader>
        <Monaco
          data-mask
          ref={monacoRef}
          language="sql"
          value={query}
          onChange={q => pageStore.setState(state => ({
            ...state,
            query: q,
          }))}
          className="size-full"
          onEnter={query => sendQuery(query)}
        />
        <div className="absolute right-6 bottom-2 z-10 flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  onClick={() => pageStore.setState(state => ({
                    ...state,
                    query: '',
                  }))}
                >
                  <RiDeleteBin5Line />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Clear
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon-sm"
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => format()}
                >
                  <RiBrush2Line />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Format SQL
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            disabled={queryStatus === 'fetching'}
            size="sm"
            onClick={() => sendQuery(query)}
          >
            <div className="flex items-center gap-1">
              Run
              {' '}
              <kbd className="flex items-center text-xs">
                {os.type === 'macos' ? <RiCommandLine className="size-3" /> : 'Ctrl'}
                <RiCornerDownLeftLine className="size-3" />
              </kbd>
            </div>
          </Button>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel minSize={20}>
        {Array.isArray(results) && results.length > 0 && (
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
                <RunnerTable
                  result={r.rows}
                  columns={r.columns}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
        {queryStatus === 'fetching'
          ? (
              <div className="h-full flex flex-col items-center justify-center">
                <RiLoader4Line className="size-6 text-muted-foreground mb-2 animate-spin" />
                <p className="text-sm text-center">
                  Running query...
                </p>
              </div>
            )
          : (!results || (Array.isArray(results) && results.length === 0)) && (
              <div className="h-full flex flex-col items-center justify-center">
                <p className="text-center">
                  No results to display
                </p>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Write and run a
                  {' '}
                  <span className="font-mono">SELECT</span>
                  {' '}
                  query above to see results here
                </p>
              </div>
            )}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
