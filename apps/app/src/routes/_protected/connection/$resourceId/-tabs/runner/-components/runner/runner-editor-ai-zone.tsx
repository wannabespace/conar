import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { EnterIcon } from '@tamery/ui/components/custom/shortcuts'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@tamery/ui/components/popover'
import { TooltipProvider } from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useMutation } from '@tanstack/react-query'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'

import { MonacoDiff } from '~/components/monaco'
import type { Connection, ConnectionResource } from '~/entities/connection/core'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries'
import { getConnectionResourceStore } from '~/entities/connection/store'
import { useSubscription as useUserSubscription } from '~/entities/user/hooks'
import { orpc } from '~/lib/orpc'
import { queryClient } from '~/main'
import { appStore, setIsSubscriptionDialogOpen } from '~/store'

const FOCUS_DELAY_MS = 100

export const RunnerEditorAIZone = ({
  connection,
  connectionResource,
  getSql,
  onUpdate,
  onClose,
}: {
  connection: Connection
  connectionResource: ConnectionResource
  getSql: () => string
  onUpdate: (sql: string) => void
  onClose: () => void
}) => {
  const isOnline = useSubscription(appStore, {
    selector: (state) => state.isOnline,
  })
  const { subscription } = useUserSubscription()
  const [prompt, setPrompt] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const ref = useRef<HTMLTextAreaElement>(null)
  const [originalSql, setOriginalSql] = useState('')

  const fullClose = () => {
    onClose()
    setAiSuggestion(null)
    setPrompt('')
  }

  useEffect(() => {
    const timeout = setTimeout(() => ref.current?.focus(), FOCUS_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (!aiSuggestion) {
      return
    }
    const timeout = setTimeout(() => ref.current?.focus(), FOCUS_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [aiSuggestion])

  const { mutate: updateSQL, isPending } = useMutation(
    orpc.ai.updateSQL.mutationOptions({ onSuccess: setAiSuggestion }),
    queryClient
  )

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      return
    }

    const sql = getSql()

    setOriginalSql(sql)

    if (aiSuggestion) {
      onUpdate(aiSuggestion)
      fullClose()
    } else {
      updateSQL({
        sql,
        prompt,
        type: connection.type,
        context: [
          'Database schemas and tables:',
          JSON.stringify(
            await queryClient.ensureQueryData(
              resourceTablesAndSchemasQueryOptions({
                connectionResource,
                showSystem: getConnectionResourceStore(
                  connectionResource.id
                ).get().showSystem,
              })
            ),
            null,
            2
          ),
        ].join('\n'),
      })
    }
  }

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col py-1 pr-6">
        <Popover open={!!aiSuggestion}>
          <PopoverTrigger
            nativeButton={false}
            render={
              <div className="relative flex h-full w-lg flex-col rounded-md border" />
            }
          >
            {!subscription && (
              <div className="bg-muted text-muted-foreground w-full px-2 py-1 text-sm">
                Please{' '}
                <Button
                  variant="outline"
                  className="px-1 py-0.5"
                  size="xs"
                  onClick={() => setIsSubscriptionDialogOpen(true)}
                >
                  upgrade
                </Button>{' '}
                your subscription to generate SQL queries.
              </div>
            )}
            <textarea
              ref={ref}
              value={prompt}
              disabled={isPending || !subscription || !isOnline}
              onChange={(e) => {
                setPrompt(e.target.value)
                setAiSuggestion(null)
              }}
              className={cn(
                `field-sizing-content flex-1 resize-none border-none px-2 py-1.5 pb-8 text-sm`,
                // Disable monaco default styles
                `focus:border-border! focus-visible:border-border! focus-visible:ring-0! focus-visible:outline-none!`
              )}
              placeholder={
                isOnline
                  ? 'Update selected SQL with AI'
                  : 'Check your internet connection to update selected SQL'
              }
              onKeyDown={(e) => {
                e.stopPropagation()

                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                } else if (e.key === 'Escape') {
                  fullClose()
                }
              }}
            />
            <Button
              size="xs"
              className="absolute right-2 bottom-2"
              disabled={isPending || !prompt.trim() || !isOnline}
              onClick={handleSubmit}
            >
              <LoadingContent loading={isPending}>
                {aiSuggestion ? 'Apply' : 'Send'}
                <EnterIcon />
              </LoadingContent>
            </Button>
          </PopoverTrigger>
          {!!aiSuggestion && (
            <PopoverContent
              style={
                {
                  '--lines-height': `${Math.max(aiSuggestion.split('\n').length, originalSql.split('\n').length) * 18 * 2}px`,
                } as CSSProperties
              }
              className="h-[min(30vh,var(--lines-height))] w-lg p-0 **:data-[slot=popover-viewport]:p-0"
            >
              <MonacoDiff
                originalValue={originalSql}
                modifiedValue={aiSuggestion}
                language="sql"
                className="h-full"
                options={{
                  scrollBeyondLastLine: false,
                  renderIndicators: false,
                  lineNumbers: 'off',
                  folding: false,
                }}
              />
            </PopoverContent>
          )}
        </Popover>
      </div>
    </TooltipProvider>
  )
}
