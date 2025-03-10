import type { Database } from '~/lib/indexeddb'
import { Button } from '@connnect/ui/components/button'
import { Input } from '@connnect/ui/components/input'
import { RiSendPlaneLine, RiSparklingLine, RiStopLargeLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { databaseColumnsQuery, databaseEnumsQuery, databaseTablesQuery } from '~/entities/database'
import { queryClient } from '~/main'
import { trpc } from '~/trpc'

interface SqlGeneratorProps {
  database: Database
  query: string
  setQuery: (query: string) => void
}

let abortController: AbortController | null = null

export function SqlGenerator({ database, query, setQuery }: SqlGeneratorProps) {
  const [sqlPrompt, setSqlPrompt] = useState('')

  const { mutate: generateSql, isPending: isGeneratingSql } = useMutation({
    mutationFn: async () => {
      abortController?.abort()
      abortController = new AbortController()

      const tables = await queryClient.ensureQueryData(databaseTablesQuery(database))

      const [columns, enums] = await Promise.all([
        Promise.all(tables.map(t => queryClient.ensureQueryData(databaseColumnsQuery(database, t.name)))),
        queryClient.ensureQueryData(databaseEnumsQuery(database)) || [],
      ])

      return trpc.ai.generateSql.mutate({
        type: database.type,
        prompt: sqlPrompt,
        context: `
          Current query: ${query}
          Tables: ${JSON.stringify(tables.map(t => t.name))}
          Columns: ${JSON.stringify(columns.flat())}
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
          <RiStopLargeLine />
        </Button>
      )}
    </form>
  )
}
