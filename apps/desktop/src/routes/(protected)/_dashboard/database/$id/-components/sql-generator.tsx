import type { Connection } from '~/lib/indexeddb'
import { Button } from '@connnect/ui/components/button'
import { Input } from '@connnect/ui/components/input'
import { RiSendPlaneLine, RiSparklingLine, RiStopLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { DANGEROUS_SQL_KEYWORDS } from '~/constants'
import { databaseEnumsQuery, databaseTablesQuery } from '~/entities/connection'
import { queryClient } from '~/main'
import { trpc } from '~/trpc'

interface SqlGeneratorProps {
  connection: Connection
  query: string
  setQuery: (query: string) => void
  onSendQuery: (query: string) => void
}

let abortController: AbortController | null = null

export function SqlGenerator({ connection, query, setQuery, onSendQuery }: SqlGeneratorProps) {
  const [sqlPrompt, setSqlPrompt] = useState('')

  const { mutate: generateSql, isPending: isGeneratingSql } = useMutation({
    mutationFn: async () => {
      abortController?.abort()
      abortController = new AbortController()

      const [tables, enums] = await Promise.all([
        queryClient.ensureQueryData(databaseTablesQuery(connection)) || [],
        queryClient.ensureQueryData(databaseEnumsQuery(connection)) || [],
      ])

      return trpc.ai.generateSql.mutate({
        type: connection.type,
        prompt: sqlPrompt,
        context: `
          Current query: ${query}
          Tables: ${JSON.stringify(tables.map(t => t.table_name))}
          Enums: ${JSON.stringify(enums)}
        `.trim(),
      }, { signal: abortController.signal })
    },
    onSettled: () => {
      abortController = null
    },
    onSuccess: ({ text, status }) => {
      setQuery(text)

      if (status === 'overloaded') {
        toast.info('The main AI model is overloaded, used a fallback model.', { duration: 5000 })
      }

      if (DANGEROUS_SQL_KEYWORDS.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()))) {
        toast.info('The AI generated a SQL query with a dangerous keyword. Review the query before running it.')
        return
      }

      onSendQuery(text)
    },
  })

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        generateSql()
      }}
    >
      <div className="relative w-full">
        <RiSparklingLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Generate SQL query using natural language"
          value={sqlPrompt}
          onChange={e => setSqlPrompt(e.target.value)}
          className="pl-10 max-w-full w-md"
        />
      </div>
      <Button
        variant="outline"
        type="submit"
        disabled={!sqlPrompt}
        size="icon"
        className="shrink-0"
        loading={isGeneratingSql}
      >
        <RiSendPlaneLine />
      </Button>
      {isGeneratingSql && (
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => abortController?.abort()}
        >
          <RiStopLine />
        </Button>
      )}
    </form>
  )
}
