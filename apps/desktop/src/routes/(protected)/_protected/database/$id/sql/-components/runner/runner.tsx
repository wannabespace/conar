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
import { hasDangerousSqlKeywords } from '~/entities/database'
import { queriesCollection } from '~/entities/query'
import { formatSql } from '~/lib/formatter'
import { runnerQueryOptions } from '.'
import { Route } from '../..'
import { databaseStore } from '../../../../-store'
import { RunnerAlertDialog } from './runner-alert-dialog'
import { RunnerContext } from './runner-context'
import { RunnerEditor } from './runner-editor'
import { RunnerQueries } from './runner-queries'
import { RunnerResults } from './runner-results'
import { RunnerSaveDialog } from './runner-save-dialog'

function useTrackSelectedLinesChange() {
  const { database } = Route.useRouteContext()
  const store = databaseStore(database.id)
  const currentLineNumbers = useStore(store, state => state.editorQueries.map(q => q.startLineNumber))

  useEffect(() => {
    const selectedLines = store.state.selectedLines
    const newSelectedLines = selectedLines.filter(line => currentLineNumbers.includes(line))

    if (
      newSelectedLines.length !== selectedLines.length
      || newSelectedLines.some((line, i) => line !== selectedLines[i])
    ) {
      store.setState(state => ({
        ...state,
        selectedLines: newSelectedLines.toSorted((a, b) => a - b),
      } satisfies typeof state))
    }
  }, [store, currentLineNumbers])
}

export function Runner() {
  const { database } = Route.useRouteContext()
  const alertDialogRef = useRef<ComponentRef<typeof RunnerAlertDialog>>(null)
  const saveQueryDialogRef = useRef<ComponentRef<typeof RunnerSaveDialog>>(null)
  const store = databaseStore(database.id)
  const selectedLines = useStore(store, state => state.selectedLines)
  const editorQueries = useStore(store, state => state.editorQueries)
  const sql = useStore(store, state => state.sql)
  const { data: { queriesCount } = { queriesCount: 0 } } = useLiveQuery(q => q
    .from({ queries: queriesCollection })
    .where(({ queries }) => eq(queries.databaseId, database.id))
    .select(({ queries }) => ({ queriesCount: count(queries.id) }))
    .findOne(),
  )
  const [isFormatting, setIsFormatting] = useState(false)

  useTrackSelectedLinesChange()

  function format() {
    const formatted = formatSql(sql, database.type)

    store.setState(state => ({
      ...state,
      sql: formatted,
    } satisfies typeof state))
  }

  const queriesToRun = useMemo(() => {
    const queries = selectedLines.length > 0
      ? editorQueries.filter(query => selectedLines.includes(query.startLineNumber))
      : editorQueries

    return queries.flatMap(({ startLineNumber, endLineNumber, queries }) => queries.map(query => ({
      startLineNumber,
      endLineNumber,
      query,
    })))
  }, [selectedLines, editorQueries])

  const { refetch: refetchRunner, fetchStatus } = useQuery(runnerQueryOptions({ database }))

  const runQueries = (queries: typeof queriesToRun) => {
    store.setState(state => ({
      ...state,
      queriesToRun: queries,
    } satisfies typeof state))
    refetchRunner()
  }

  function runQueriesWithAlert(editorQueries: Parameters<typeof runQueries>[0]) {
    const hasDangerousKeywords = editorQueries.some(({ query }) => hasDangerousSqlKeywords(query))

    if (hasDangerousKeywords) {
      alertDialogRef.current?.confirm(
        editorQueries.map(({ query }) => query),
        () => runQueries(editorQueries),
      )
    }
    else {
      runQueries(editorQueries)
    }
  }

  return (
    <RunnerContext.Provider
      value={{
        run: runQueriesWithAlert,
        save: q => saveQueryDialogRef.current?.open(q),
      }}
    >
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
                      onClick={() => {
                        format()
                        setIsFormatting(true)
                      }}
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
              <div className="relative h-[calc(100%-(--spacing(14)))] flex-1">
                <RunnerEditor />
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
                    to run the focused query
                  </span>
                </span>
              </div>
              <RunnerSaveDialog ref={saveQueryDialogRef} />
              <RunnerAlertDialog ref={alertDialogRef} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel minSize={20}>
          <RunnerResults />
        </ResizablePanel>
      </ResizablePanelGroup>
    </RunnerContext.Provider>
  )
}
