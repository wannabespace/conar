import type { ComponentRef } from 'react'
import { Button } from '@conar/ui/components/button'
import { CardHeader, CardTitle } from '@conar/ui/components/card'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { CtrlEnter, CtrlLetter } from '@conar/ui/components/custom/shortcuts'
import { Kbd } from '@conar/ui/components/kbd'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@conar/ui/components/resizable'
import NumberFlow from '@number-flow/react'
import { RiBrush2Line, RiCheckLine, RiPlayFill, RiStarLine } from '@remixicon/react'
import { count, eq, useLiveQuery } from '@tanstack/react-db'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { getSQLQueries, hasDangerousSqlKeywords } from '~/entities/database'
import { queriesCollection } from '~/entities/query'
import { formatSql } from '~/lib/formatter'
import { runnerQueryOptions } from '.'
import { Route } from '../..'
import { pageHooks, pageStore } from '../../-page'
import { RunnerAlertDialog } from './runner-alert-dialog'
import { RunnerEditor } from './runner-editor'
import { RunnerQueries } from './runner-queries'
import { RunnerResults } from './runner-results'
import { RunnerSaveDialog } from './runner-save-dialog'

export function Runner() {
  const { database } = Route.useRouteContext()
  const alertDialogRef = useRef<ComponentRef<typeof RunnerAlertDialog>>(null)
  const saveQueryDialogRef = useRef<ComponentRef<typeof RunnerSaveDialog>>(null)
  const store = useMemo(() => pageStore(database.id), [database.id])
  const selectedLines = useStore(store, state => state.selectedLines)
  const queries = useStore(store, state => getSQLQueries(state.sql))
  const { data: { queriesCount } = { queriesCount: 0 } } = useLiveQuery(q => q
    .from({ queries: queriesCollection })
    .where(({ queries }) => eq(queries.databaseId, database.id))
    .select(({ queries }) => ({ queriesCount: count(queries.id) }))
    .findOne(),
  )
  const sql = useStore(store, state => state.sql)
  const [isFormatting, setIsFormatting] = useState(false)

  useEffect(() => {
    const currentLineNumbers = queries.map(q => q.startLineNumber)
    const selectedLines = store.state.selectedLines
    const newSelectedLines = selectedLines.filter(line => currentLineNumbers.includes(line))

    if (
      newSelectedLines.length !== selectedLines.length
      || newSelectedLines.some((line, i) => line !== selectedLines[i])
    ) {
      store.setState(state => ({
        ...state,
        selectedLines: newSelectedLines.toSorted((a, b) => a - b),
      }))
    }
  }, [store, queries])

  function format() {
    const formatted = formatSql(sql, database.type)

    store.setState(state => ({
      ...state,
      sql: formatted,
    }))
    setIsFormatting(true)
  }

  const queriesToRun = useMemo(() => {
    if (selectedLines.length > 0) {
      return selectedLines.flatMap(lineNumber => queries.find(query => query.startLineNumber === lineNumber)?.queries || [])
    }

    return queries.flatMap(query => query.queries)
  }, [selectedLines, queries])

  const { refetch: refetchRunner, status, error, fetchStatus } = useQuery(runnerQueryOptions({ database }))

  const runQueries = (queries: string[]) => {
    store.setState(state => ({
      ...state,
      queriesToRun: queries,
    }))
    refetchRunner()
  }

  function runQueriesWithAlert(queries: string[]) {
    const hasDangerousKeywords = queries.some(query => hasDangerousSqlKeywords(query))

    if (hasDangerousKeywords) {
      alertDialogRef.current?.open(queries)
    }
    else {
      runQueries(queries)
    }
  }

  useEffect(() => {
    if (status === 'error') {
      const message = error.cause ? String(error.cause) : error.message

      toast.error(message, {
        action: {
          label: 'Fix with AI',
          onClick: () => {
            pageHooks.callHook('fix', message)
          },
        },
        duration: 5000,
      })
    }
  }, [error, status])

  return (
    <ResizablePanelGroup autoSaveId="sql-layout-y" direction="vertical">
      <ResizablePanel minSize={20}>
        <ResizablePanelGroup autoSaveId="sql-layout-x" direction="horizontal">
          <ResizablePanel minSize={50}>
            <CardHeader className="bg-card py-3 h-14">
              <CardTitle className="flex items-center gap-2 justify-between">
                SQL Queries Runner
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        className="relative"
                        variant="secondary"
                        size="sm"
                      >
                        <RiStarLine />
                        Saved
                        <span className="bg-accent rounded-full text-xs px-1.5 h-5 flex items-center justify-center">
                          {queriesCount}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="min-w-md p-0"
                      onOpenAutoFocus={e => e.preventDefault()}
                    >
                      <RunnerQueries />
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => format()}
                  >
                    <ContentSwitch
                      active={isFormatting}
                      activeContent={<RiCheckLine className="text-success" />}
                      onSwitchEnd={() => setIsFormatting(false)}
                    >
                      <RiBrush2Line />
                    </ContentSwitch>
                    Format
                  </Button>
                  <Button
                    disabled={fetchStatus === 'fetching'}
                    size="sm"
                    onClick={() => runQueriesWithAlert(queriesToRun)}
                  >
                    <RiPlayFill />
                    Run
                    {' '}
                    {selectedLines.length > 0 ? 'selected' : 'all'}
                    {selectedLines.length > 0 && (
                      <NumberFlow
                        value={queriesToRun.length}
                        prefix="("
                        suffix=")"
                        className="tabular-nums"
                        spinTiming={{ duration: 200 }}
                      />
                    )}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <div className="relative h-[calc(100%-theme(spacing.14))] flex-1">
              <RunnerEditor
                onRun={runQueriesWithAlert}
                onSave={q => saveQueryDialogRef.current?.open(q)}
              />
              <span className="pointer-events-none text-xs text-muted-foreground flex flex-col items-end absolute bottom-2 right-6">
                <span className="flex items-center gap-1">
                  <Kbd asChild>
                    <CtrlLetter letter="K" userAgent={navigator.userAgent} />
                  </Kbd>
                  {' '}
                  to call the AI
                </span>
                <span className="flex items-center gap-1">
                  <Kbd asChild>
                    <CtrlEnter userAgent={navigator.userAgent} />
                  </Kbd>
                  {' '}
                  to run the focused line
                </span>
              </span>
            </div>
            <RunnerSaveDialog ref={saveQueryDialogRef} />
            <RunnerAlertDialog ref={alertDialogRef} onConfirm={runQueries} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel minSize={20}>
        <RunnerResults />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
