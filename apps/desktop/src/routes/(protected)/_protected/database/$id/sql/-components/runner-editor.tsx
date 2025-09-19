import type { editor } from 'monaco-editor'
import type { ComponentProps, ComponentRef } from 'react'
import type { databases } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { CtrlEnter } from '@conar/ui/components/custom/ctrl-enter'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiBrush2Line, RiCheckLine, RiDeleteBin5Line, RiFileCopyLine, RiSaveLine } from '@remixicon/react'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Monaco } from '~/components/monaco'
import { hasDangerousSqlKeywords } from '~/entities/database'
import { formatSql } from '~/lib/formatter'
import { dbQuery } from '~/lib/query'
import { Route } from '..'
import { chatQuery } from '../-chat'
import { pageHooks, pageStore } from '../-lib'
import { RunnerAlertDialog } from './runner-alert-dialog'
import { SaveQueryDialog } from './save-query-dialog'

export function runnerQueryOptions({ database, query }: { database: typeof databases.$inferSelect, query: string }) {
  return queryOptions({
    queryKey: ['sql', database.id],
    queryFn: async ({ signal }) => {
      let shouldRun = true

      signal.onabort = () => {
        shouldRun = false
      }

      const result = await dbQuery(database.id, { query })

      if (!shouldRun) {
        return null!
      }

      return result
    },
    throwOnError: false,
    enabled: false,
  })
}

export function RunnerEditor({ className, ...props }: ComponentProps<'div'>) {
  const { id } = Route.useParams()
  const { database } = Route.useRouteContext()
  const query = useStore(pageStore, state => state.query)
  const monacoRef = useRef<editor.IStandaloneCodeEditor>(null)
  const saveQueryDialogRef = useRef<ComponentRef<typeof SaveQueryDialog>>(null)

  useMountedEffect(() => {
    chatQuery.set(id, query)
  }, [id, query])

  const { refetch: runQuery, status, fetchStatus: queryStatus, error } = useQuery(runnerQueryOptions({ database, query }))

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

  const [isCopying, setIsCopying] = useState(false)
  const [isFormatting, setIsFormatting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  function handleCopy() {
    copy(query)
    setIsCopying(true)
  }

  function handleClear() {
    pageStore.setState(state => ({
      ...state,
      query: '',
    }))
    setIsClearing(true)
  }

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
    setIsFormatting(true)
  }

  useEffect(() => {
    return pageHooks.hook('focusRunner', () => {
      monacoRef.current?.focus()
    })
  }, [])

  return (
    <div
      className={cn('relative', className)}
      {...props}
    >
      <RunnerAlertDialog
        query={query}
        open={isAlertVisible}
        setOpen={setIsAlertVisible}
        confirm={() => runQuery()}
      />
      <SaveQueryDialog
        ref={saveQueryDialogRef}
        database={database}
      />
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
        onEnter={sendQuery}
      />
      <div className="absolute right-6 bottom-2 z-10 flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon-sm"
                onClick={() => saveQueryDialogRef.current?.open(query)}
              >
                <RiSaveLine />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Save query
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon-sm"
                onClick={handleClear}
              >
                <ContentSwitch
                  active={isClearing}
                  activeContent={<RiCheckLine className="text-success" />}
                  onActiveChange={() => setIsClearing(false)}
                >
                  <RiDeleteBin5Line />
                </ContentSwitch>
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
                onClick={handleCopy}
              >
                <ContentSwitch
                  active={isCopying}
                  activeContent={<RiCheckLine className="text-success" />}
                  onActiveChange={() => setIsCopying(false)}
                >
                  <RiFileCopyLine />
                </ContentSwitch>
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
                size="icon-sm"
                onClick={() => format()}
              >
                <ContentSwitch
                  active={isFormatting}
                  activeContent={<RiCheckLine className="text-success" />}
                  onActiveChange={() => setIsFormatting(false)}
                >
                  <RiBrush2Line />
                </ContentSwitch>
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
          <LoadingContent loading={queryStatus === 'fetching'}>
            <ContentSwitch
              activeContent={<RiCheckLine />}
              active={queryStatus === 'fetching'}
            >
              <span className="flex items-center gap-1">
                Run
                {' '}
                <CtrlEnter userAgent={navigator.userAgent} />
              </span>
            </ContentSwitch>
          </LoadingContent>
        </Button>
      </div>
    </div>
  )
}
