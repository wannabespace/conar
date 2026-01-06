import type { databases } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Enter } from '@conar/ui/components/custom/shortcuts'
import { Popover, PopoverAnchor, PopoverContent } from '@conar/ui/components/popover'
import { Textarea } from '@conar/ui/components/textarea'
import { cn } from '@conar/ui/lib/utils'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { MonacoDiff } from '~/components/monaco'
import { databaseTablesAndSchemasQuery } from '~/entities/database/queries'
import { useSubscription } from '~/entities/user/hooks'
import { orpcQuery } from '~/lib/orpc'
import { queryClient } from '~/main'
import { setIsSubscriptionDialogOpen } from '~/store'

export function RunnerEditorAIZone({
  database,
  getSql,
  onUpdate,
  onClose,
}: {
  database: typeof databases.$inferSelect
  getSql: () => string
  onUpdate: (sql: string) => void
  onClose: () => void
}) {
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
    }, 0)

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
        type: database.type,
        context: [
          'Database schemas and tables:',
          JSON.stringify(await queryClient.ensureQueryData(databaseTablesAndSchemasQuery({ database })), null, 2),
        ].join('\n'),
      })
    }
  }

  return (
    <div className="flex h-full flex-col py-1 pr-6">
      <Popover open={!!aiSuggestion}>
        <PopoverAnchor asChild>
          <div className="relative h-full w-lg">
            {!subscription && (
              <span
                className={`
                  absolute top-0 right-0 left-0 z-10 p-2 text-sm
                  text-muted-foreground
                `}
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
              </span>
            )}
            <Textarea
              ref={ref}
              value={prompt}
              disabled={isPending || !subscription}
              onChange={(e) => {
                setPrompt(e.target.value)
                setAiSuggestion(null)
              }}
              className={cn(
                'field-sizing-content h-full min-h-full resize-none px-2 py-1.5',
                // Disable monaco default styles
                `
                  focus:border-border!
                  focus-visible:border-border! focus-visible:ring-0!
                  focus-visible:outline-none!
                `,
              )}
              placeholder={subscription ? 'Update selected SQL with AI' : ''}
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
              disabled={isPending || !prompt.trim()}
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
