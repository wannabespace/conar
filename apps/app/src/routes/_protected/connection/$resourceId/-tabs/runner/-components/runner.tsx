import {
  ArrowUp02Icon,
  BrushCleaningIcon,
  SaveIcon,
  Bookmark02Icon,
  StopIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { Statement } from '@tamery/sql'
import {
  destructiveKeywords,
  dialects,
  splitStatements,
  statementAt,
} from '@tamery/sql'
import { Button } from '@tamery/ui/components/button'
import { ContentSwitch } from '@tamery/ui/components/custom/content-switch'
import {
  ResizableGroup,
  ResizablePanel,
  ResizableSeparator,
} from '@tamery/ui/components/custom/resizable'
import { Ctrl, EnterIcon } from '@tamery/ui/components/custom/shortcuts'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@tamery/ui/components/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { count, eq, useLiveQuery } from '@tanstack/react-db'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { editor } from 'monaco-editor'
import { Range } from 'monaco-editor'
import type { ComponentRef } from 'react'
import { useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'

import { useCollections } from '~/entities/collections'
import { wrapExplainQuery } from '~/entities/connection/utils'
import {
  RUNNER_RESULTS_DEFAULT_HEIGHT,
  RUNNER_RESULTS_MAX_HEIGHT,
  RUNNER_RESULTS_MIN_HEIGHT,
} from '~/lib/constants'
import { formatSql } from '~/lib/formatter'

import type { RunnerActions } from '../-lib/actions'
import { RunnerActionsContext } from '../-lib/actions'
import type { RunnerStatement } from '../-lib/run'
import { runnerResultsOptions, runStatements, stopRun } from '../-lib/run'
import {
  runnerStatements,
  setLayout,
  setQuery,
  useRunnerPageStore,
  useRunnerTab,
} from '../-lib/store'
import { RunHistoryButton } from './run-history'
import { useAiEdit } from './runner-ai-edit'
import { RunnerAlertDialog } from './runner-alert-dialog'
import { RunnerEditor } from './runner-editor'
import { RunnerResults } from './runner-results'
import { RunnerSaveDialog } from './runner-save-dialog'
import { SavedQueries } from './saved-queries'

const { useRouteContext } = getRouteApi(
  '/_protected/connection/$resourceId/$tabId'
)

const rangeOf = (model: editor.ITextModel, statement: Statement) =>
  Range.fromPositions(
    model.getPositionAt(statement.start),
    model.getPositionAt(statement.end)
  )

const toRunnerStatement = (statement: Statement): RunnerStatement => ({
  end: statement.end,
  source: statement.text,
  start: statement.start,
  text: statement.text,
})

const ToolbarButton = ({
  label,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <Button variant="ghost" size="icon-sm" aria-label={label} {...props} />
      }
    />
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
)

const SavedQueriesButton = () => {
  const { connectionResource } = useRouteContext()
  const { queriesCollection } = useCollections()
  const { data: { queriesCount } = { queriesCount: 0 } } = useLiveQuery({
    query: (q) =>
      q
        .from({ queries: queriesCollection })
        .where(({ queries }) =>
          eq(queries.connectionResourceId, connectionResource.id)
        )
        .select(({ queries }) => ({ queriesCount: count(queries.id) }))
        .findOne(),
  })
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="ghost" size="sm" />}>
        <HugeiconsIcon icon={Bookmark02Icon} strokeWidth={2} />
        Saved
        {queriesCount > 0 && (
          <span className="text-muted-foreground tabular-nums">
            {queriesCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" padding="none" className="w-80">
        <SavedQueries onPicked={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

export const Runner = () => {
  const { connection, connectionResource } = useRouteContext()
  const tab = useRunnerTab()
  const store = useRunnerPageStore()
  const { queriesCollection } = useCollections()
  const savedQueryId = useSubscription(store, {
    selector: (state) => state.savedQueryId,
  })
  const { data: linkedQuery } = useLiveQuery(
    (q) =>
      q
        .from({ queries: queriesCollection })
        .where(({ queries }) => eq(queries.id, savedQueryId ?? ''))
        .findOne(),
    [savedQueryId]
  )
  const editorRef = useRef<editor.IStandaloneCodeEditor>(null)
  const alertDialogRef = useRef<ComponentRef<typeof RunnerAlertDialog>>(null)
  const saveDialogRef = useRef<ComponentRef<typeof RunnerSaveDialog>>(null)
  const [formatted, setFormatted] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const { resultsHeight, resultsVisible } = useSubscription(store, {
    selector: (state) => state.layout,
  })
  const { data: lastRun } = useQuery(runnerResultsOptions(tab))
  const running = lastRun?.running ?? false
  const statements = runnerStatements({
    ...tab,
    connectionType: connection.type,
  })
  const dialect = dialects[connection.type]
  const aiEdit = useAiEdit({
    connectionResource,
    connectionType: connection.type,
    editorRef,
  })

  /** The selection when there is one, else the statement under the caret. */
  const current = (): {
    statements: RunnerStatement[]
    range: Range | null
  } => {
    const codeEditor = editorRef.current
    const model = codeEditor?.getModel()
    const selection = codeEditor?.getSelection()
    const position = codeEditor?.getPosition()
    if (!model || !position) {
      return { range: null, statements: [] }
    }
    if (selection && !selection.isEmpty()) {
      const offset = model.getOffsetAt(selection.getStartPosition())
      return {
        range: selection,
        statements: splitStatements(
          model.getValueInRange(selection),
          dialect
        ).map((statement) => ({
          end: offset + statement.end,
          source: statement.text,
          start: offset + statement.start,
          text: statement.text,
        })),
      }
    }
    const statement = statementAt(
      statements.get(),
      model.getOffsetAt(position),
      model.getValue()
    )
    if (!statement) {
      return { range: null, statements: [] }
    }
    // Statements sharing a line read as one unit (`select 1; select 2;`), so they run together.
    const lineOf = (offset: number) => model.getPositionAt(offset).lineNumber
    const first = lineOf(statement.start)
    const last = lineOf(statement.terminatorEnd)
    const sameLines = statements
      .get()
      .filter(
        (item) =>
          lineOf(item.start) <= last && lineOf(item.terminatorEnd) >= first
      )
    const [head] = sameLines
    const tail = sameLines.at(-1)
    return {
      range:
        head && tail
          ? Range.fromPositions(
              model.getPositionAt(head.start),
              model.getPositionAt(tail.end)
            )
          : rangeOf(model, statement),
      statements: sameLines.map(toRunnerStatement),
    }
  }

  const run = (pending: RunnerStatement[]) => {
    if (pending.length === 0) {
      return
    }
    const start = () =>
      runStatements({
        connectionResource,
        statements: pending,
        tabId: tab.tabId,
      })
    const keywords = destructiveKeywords(
      pending.map((statement) => statement.text).join(';\n'),
      dialect
    )
    if (keywords.length > 0) {
      alertDialogRef.current?.confirm(keywords, start)
    } else {
      start()
    }
  }

  const actions: RunnerActions = {
    askAi: () => {
      const { range } = current()
      if (range) {
        aiEdit.open(range)
      }
    },
    explainCurrent: () =>
      run(
        current().statements.map((statement) => ({
          ...statement,
          text: wrapExplainQuery(statement.source),
        }))
      ),
    fixWithAi: ({ end, error, source, start }) => {
      const model = editorRef.current?.getModel()
      if (!model || model.getValue().slice(start, end) !== source) {
        toast.error('The statement changed since it ran — run it again first')
        return
      }
      aiEdit.fix(
        Range.fromPositions(
          model.getPositionAt(start),
          model.getPositionAt(end)
        ),
        error
      )
    },
    focus: () => editorRef.current?.focus(),
    format: () => {
      setQuery(store, formatSql(store.get().query, connection.type))
      setFormatted(true)
    },
    runAll: () => run(statements.get().map(toRunnerStatement)),
    runCurrent: () => run(current().statements),
    renameSaved: (query) =>
      saveDialogRef.current?.open({ kind: 'rename', query }),
    saveAll: () => {
      saveDialogRef.current?.open({
        kind: 'tab',
        linked: linkedQuery,
        sql: statements.get().length > 0 ? store.get().query : '',
      })
    },
    saveCurrent: () => {
      const sources = current().statements.map((statement) => statement.source)
      if (sources.length > 0) {
        saveDialogRef.current?.open({
          kind: 'statement',
          sql: sources.join(';\n\n'),
        })
      }
    },
  }

  useHotkey(
    'Mod+Enter',
    (event) => {
      event.preventDefault()
      actions.runCurrent()
    },
    { enabled: !confirming }
  )
  useHotkey(
    'Mod+Shift+Enter',
    (event) => {
      event.preventDefault()
      actions.runAll()
    },
    { enabled: !confirming }
  )

  return (
    <RunnerActionsContext value={actions}>
      <ResizableGroup orientation="vertical">
        <ResizablePanel className="flex min-h-0 flex-col">
          <div className="flex h-10 shrink-0 items-center gap-1 px-2">
            {running ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => stopRun(tab)}
              >
                <HugeiconsIcon icon={StopIcon} strokeWidth={2} />
                Stop
              </Button>
            ) : (
              <Button size="sm" onClick={() => actions.runAll()}>
                Run all
                <span className="text-primary-foreground/70 flex items-center">
                  <Ctrl className="size-2.5" userAgent={navigator.userAgent} />
                  <HugeiconsIcon
                    icon={ArrowUp02Icon}
                    strokeWidth={2}
                    className="size-2.5"
                  />
                  <EnterIcon className="size-2.5" />
                </span>
              </Button>
            )}
            <div className="flex-1" />
            <ToolbarButton label="Format" onClick={() => actions.format()}>
              <ContentSwitch
                active={formatted}
                activeContent={
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    strokeWidth={2}
                    className="text-success"
                  />
                }
                onSwitchEnd={() => setFormatted(false)}
              >
                <HugeiconsIcon icon={BrushCleaningIcon} strokeWidth={2} />
              </ContentSwitch>
            </ToolbarButton>
            <ToolbarButton
              label={
                linkedQuery
                  ? `Update “${linkedQuery.name}”`
                  : 'Save tab as query'
              }
              onClick={() => actions.saveAll()}
            >
              <HugeiconsIcon icon={SaveIcon} strokeWidth={2} />
            </ToolbarButton>
            <RunHistoryButton />
            <SavedQueriesButton />
          </div>
          <div className="relative min-h-0 flex-1">
            <RunnerEditor
              editorRef={editorRef}
              editing={aiEdit.editing}
              reviewing={aiEdit.reviewing}
              acceptAi={aiEdit.accept}
              rejectAi={aiEdit.reject}
            />
          </div>
          <RunnerSaveDialog ref={saveDialogRef} />
          <RunnerAlertDialog
            ref={alertDialogRef}
            onOpenChange={setConfirming}
          />
        </ResizablePanel>
        <ResizableSeparator aria-label="Resize results" />
        <ResizablePanel
          size={resultsHeight}
          onSizeChange={(height) => setLayout(store, { resultsHeight: height })}
          defaultSize={RUNNER_RESULTS_DEFAULT_HEIGHT}
          minSize={RUNNER_RESULTS_MIN_HEIGHT}
          maxSize={RUNNER_RESULTS_MAX_HEIGHT}
          collapsed={!resultsVisible}
          onCollapsedChange={(collapsed) =>
            setLayout(store, { resultsVisible: !collapsed })
          }
        >
          <RunnerResults />
        </ResizablePanel>
      </ResizableGroup>
    </RunnerActionsContext>
  )
}
