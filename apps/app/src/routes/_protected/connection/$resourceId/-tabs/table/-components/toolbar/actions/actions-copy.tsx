import { enabledFilters } from '@tamery/shared/filters'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { CopyButton } from '@tamery/ui/components/custom/copy-button'
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogTitle,
} from '@tamery/ui/components/dialog'
import { Tabs, TabsList, TabsTrigger } from '@tamery/ui/components/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'

import { GENERATOR_COMPATIBILITY } from '~/entities/connection/generators/compatibility'
import {
  generateQueryDrizzle,
  generateSchemaDrizzle,
} from '~/entities/connection/generators/formats/drizzle'
import {
  generateQueryKysely,
  generateSchemaKysely,
} from '~/entities/connection/generators/formats/kysely'
import {
  generateQueryPrisma,
  generateSchemaPrisma,
} from '~/entities/connection/generators/formats/prisma'
import {
  generateQuerySQL,
  generateSchemaSQL,
} from '~/entities/connection/generators/formats/sql'
import { generateSchemaTypeScript } from '~/entities/connection/generators/formats/typescript'
import { generateSchemaZod } from '~/entities/connection/generators/formats/zod'
import type {
  QueryParams,
  SchemaParams,
} from '~/entities/connection/generators/types'
import type { GeneratorFormat } from '~/entities/connection/generators/utils'
import { resourceIndexesQueryOptions } from '~/entities/connection/queries/indexes'

import { useTableColumnsContext } from '../../../-lib/columns'
import { useTablePageStore } from '../../../-lib/store'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

type Kind = 'schema' | 'query'

interface Format {
  type: GeneratorFormat
  label: string
  language: string
  generator: (params: SchemaParams & QueryParams) => string
}

const FORMATS: Record<Kind, Format[]> = {
  query: [
    { generator: generateQuerySQL, label: 'SQL', language: 'sql', type: 'sql' },
    {
      generator: generateQueryPrisma,
      label: 'Prisma',
      language: 'typescript',
      type: 'prisma',
    },
    {
      generator: generateQueryDrizzle,
      label: 'Drizzle',
      language: 'typescript',
      type: 'drizzle',
    },
    {
      generator: generateQueryKysely,
      label: 'Kysely',
      language: 'typescript',
      type: 'kysely',
    },
  ],
  schema: [
    {
      generator: generateSchemaSQL,
      label: 'SQL',
      language: 'sql',
      type: 'sql',
    },
    {
      generator: generateSchemaTypeScript,
      label: 'TypeScript',
      language: 'typescript',
      type: 'ts',
    },
    {
      generator: generateSchemaZod,
      label: 'Zod',
      language: 'typescript',
      type: 'zod',
    },
    {
      generator: generateSchemaPrisma,
      label: 'Prisma',
      language: 'prisma',
      type: 'prisma',
    },
    {
      generator: generateSchemaDrizzle,
      label: 'Drizzle',
      language: 'typescript',
      type: 'drizzle',
    },
    {
      generator: generateSchemaKysely,
      label: 'Kysely',
      language: 'typescript',
      type: 'kysely',
    },
  ],
}

export const ActionsCopy = ({
  table,
  schema,
  open,
  onOpenChange,
}: {
  table: string
  schema: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const { connection, connectionResource } = useRouteContext()
  const store = useTablePageStore()
  const filters = useSubscription(store, {
    selector: (state) => state.filters,
  })
  const { columns } = useTableColumnsContext()
  const { data: indexes } = useQuery(
    resourceIndexesQueryOptions({ connectionResource })
  )
  const [kind, setKind] = useState<Kind>('schema')
  const [formatType, setFormatType] = useState<GeneratorFormat>('sql')

  const formats = FORMATS[kind].filter((f) => {
    const compatible = GENERATOR_COMPATIBILITY[f.type]
    return !compatible || compatible.includes(connection.type)
  })
  const format = formats.find((f) => f.type === formatType) ?? formats[0]

  if (!format) {
    return null
  }

  const code = format.generator({
    columns,
    dialect: connection.type,
    filters: enabledFilters(filters),
    indexes: indexes ?? [],
    schema,
    table,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange} variant="panel">
      <DialogContent showCloseButton={false}>
        <div className="grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b px-2">
          <DialogTitle className="truncate px-2" data-mask>
            {table}
          </DialogTitle>
          <Tabs value={kind} onValueChange={setKind}>
            <TabsList>
              <TabsTrigger value="schema" className="px-4">
                Schema
              </TabsTrigger>
              <TabsTrigger value="query" className="px-4">
                Query
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <DialogCloseButton className="justify-self-end" />
        </div>
        <Tabs
          value={format.type}
          onValueChange={setFormatType}
          className="min-h-0 flex-1 gap-0"
        >
          <TabsList variant="bar" className="shrink-0 after:hidden">
            {formats.map((f) => (
              <TabsTrigger
                key={f.type}
                value={f.type}
                className="flex-none transition-none"
              >
                {f.label}
              </TabsTrigger>
            ))}
            <div className="flex flex-1 items-center justify-end border-b px-1">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <CopyButton
                      size="icon-xs"
                      variant="ghost"
                      aria-label="Copy"
                      className="text-muted-foreground"
                      text={code}
                    />
                  }
                />
                <TooltipContent side="bottom">
                  Copy {format.label}
                </TooltipContent>
              </Tooltip>
            </div>
          </TabsList>
          <CodeBlock
            className="no-scrollbar scroll-fade min-h-0 flex-1 py-2"
            code={code}
            language={format.language}
            lineNumbers
            size="xs"
            wrap
          />
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
