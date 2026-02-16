import type { connections } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Enter } from '@conar/ui/components/custom/shortcuts'
import { Popover, PopoverAnchor, PopoverContent } from '@conar/ui/components/popover'
import { Textarea } from '@conar/ui/components/textarea'
import { cn } from '@conar/ui/lib/utils'
import { useMutation } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useEffect, useRef, useState } from 'react'
import { MonacoDiff } from '~/components/monaco'
import { connectionTablesAndSchemasQuery } from '~/entities/connection/queries'
import { connectionStore } from '~/entities/connection/store'
import { useSubscription } from '~/entities/user/hooks'
import { orpcQuery } from '~/lib/orpc'
import { queryClient } from '~/main'
import { appStore, setIsSubscriptionDialogOpen } from '~/store'

export function RunnerEditorAIZone({
  connection,
  getSql,
  onUpdate,
  onClose,
}: {
  connection: typeof connections.$inferSelect
  getSql: () => string
  onUpdate: (sql: string) => void
  onClose: () => void
}) {
  const isOnline = useStore(appStore, state => state.isOnline)
  const store = connectionStore(connection.id)
  const { subscription } = useSubscription()
  const [prompt, setPrompt] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const ref = useRef<HTMLTextAreaElement>(null)
  const [originalSql, setOriginalSql] = useState('')

  function fullClose() {
    onClose()
    setAiSuggestion(null)
    setPrompt('')
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      ref.current?.focus()
    }, 100)

    return () => {
      clearTimeout(timeout)
    }
  }, [ref])

  const { mutate: updateSQL, isPending } = useMutation(orpcQuery.ai.updateSQL.mutationOptions({
    onSuccess: (data) => {
      setAiSuggestion(data)
    },
  }), queryClient)

  async function handleSubmit() {
    if (!prompt.trim()) {
      return
    }

    const sql = getSql()

    setOriginalSql(sql)

    if (aiSuggestion) {
      onUpdate(aiSuggestion)
      fullClose()
    }
    else {
      updateSQL({
        sql,
        prompt,
        type: connection.type,
        context: [
          'Database schemas and tables:',
          JSON.stringify(await queryClient.ensureQueryData(connectionTablesAndSchemasQuery({ connection, showSystem: store.state.showSystem })), null, 2),
        ].join('\n'),
      })
    }
  }

  return (
    <div className="flex h-full flex-col py-1 pr-6">
      <Popover open={!!aiSuggestion}>
        <PopoverAnchor asChild>
          <div className="relative flex h-full w-lg flex-col rounded-md border">
            {!subscription && (
              <div
                className="
                  w-full bg-muted px-2 py-1 text-sm text-muted-foreground
                "
              >
                Please
                {' '}
                <Button
                  variant="outline"
                  className="px-1 py-0.5"
                  size="xs"
                  onClick={() => setIsSubscriptionDialogOpen(true)}
                >
                  upgrade
                </Button>
                {' '}
                your subscription to generate SQL queries.
              </div>
            )}
            <Textarea
              ref={ref}
              value={prompt}
              disabled={isPending || !subscription || !isOnline}
              onChange={(e) => {
                setPrompt(e.target.value)
                setAiSuggestion(null)
              }}
              className={cn(
                `
                  field-sizing-content flex-1 resize-none border-none px-2
                  py-1.5 pb-8
                `,
                // Disable monaco default styles
                `
                  focus:border-border!
                  focus-visible:border-border! focus-visible:ring-0!
                  focus-visible:outline-none!
                `,
              )}
              placeholder={isOnline ? 'Update selected SQL with AI' : 'Check your internet connection to update selected SQL'}
              onKeyDown={(e) => {
                e.stopPropagation()

                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
                else if (e.key === 'Escape') {
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
              <LoadingContent loading={isPending} loaderClassName="size-4">
                {aiSuggestion ? 'Apply' : 'Send'}
                <Enter />
              </LoadingContent>
            </Button>
          </div>
        </PopoverAnchor>
        {!!aiSuggestion && (
          <PopoverContent
            style={{
              '--lines-height': `${Math.max(aiSuggestion.split('\n').length, originalSql.split('\n').length) * 18 * 2}px`,
            }}
            className="h-[min(30vh,var(--lines-height))] w-lg p-0"
            onOpenAutoFocus={(e) => {
              e.preventDefault()
              ref.current?.focus()
            }}
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
  )
}
