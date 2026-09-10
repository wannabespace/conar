import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { enabledFilters } from '@tamery/shared/filters'
import { Button } from '@tamery/ui/components/button'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { CopyButton } from '@tamery/ui/components/custom/copy-button'
import {
  Dialog,
  DialogClose,
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
import type { GeneratorFormat } from '~/entities/connection/generators/utils'
import { resourceIndexesQueryOptions } from '~/entities/connection/queries/indexes'

import { useTableColumnsContext } from '../../../-lib/columns'
import { useTablePageStore } from '../../../-lib/store'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

type Kind = 'schema' | 'query'

type Format = {
  type: GeneratorFormat
  label: string
  language: string
} & (
  | { kind: 'schema'; generator: typeof generateSchemaSQL }
  | { kind: 'query'; generator: typeof generateQuerySQL }
)

const FORMATS: Record<Kind, Format[]> = {
  query: [
    {
      generator: generateQuerySQL,
      kind: 'query',
      label: 'SQL',
      language: 'sql',
      type: 'sql',
    },
    {
      generator: generateQueryPrisma,
      kind: 'query',
      label: 'Prisma',
      language: 'typescript',
      type: 'prisma',
    },
    {
      generator: generateQueryDrizzle,
      kind: 'query',
      label: 'Drizzle',
      language: 'typescript',
      type: 'drizzle',
    },
    {
      generator: generateQueryKysely,
      kind: 'query',
      label: 'Kysely',
      language: 'typescript',
      type: 'kysely',
    },
  ],
  schema: [
    {
      generator: generateSchemaSQL,
      kind: 'schema',
      label: 'SQL',
      language: 'sql',
      type: 'sql',
    },
    {
      generator: generateSchemaTypeScript,
      kind: 'schema',
      label: 'TypeScript',
      language: 'typescript',
      type: 'ts',
    },
    {
      generator: generateSchemaZod,
      kind: 'schema',
      label: 'Zod',
      language: 'typescript',
      type: 'zod',
    },
    {
      generator: generateSchemaPrisma,
      kind: 'schema',
      label: 'Prisma',
      language: 'prisma',
      type: 'prisma',
    },
    {
      generator: generateSchemaDrizzle,
      kind: 'schema',
      label: 'Drizzle',
      language: 'typescript',
      type: 'drizzle',
    },
    {
      generator: generateSchemaKysely,
      kind: 'schema',
      label: 'Kysely',
      language: 'typescript',
      type: 'kysely',
    },
  ],
}

const isFormatCompatible = (format: Format, connectionType: ConnectionType) => {
  const compat = GENERATOR_COMPATIBILITY[format.type]
  return !compat || compat.includes(connectionType)
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

  const formats = FORMATS[kind].filter((f) =>
    isFormatCompatible(f, connection.type)
  )
  const format = formats.find((f) => f.type === formatType) ?? formats[0]

  if (!format) {
    return null
  }

  const code =
    format.kind === 'schema'
      ? format.generator({
          table,
          schema,
          columns,
          dialect: connection.type,
          indexes: indexes ?? [],
        })
      : format.generator({
          table,
          schema,
          filters: enabledFilters(filters),
          dialect: connection.type,
        })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[70vh] max-h-140 flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <div className="grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b px-2">
          <DialogTitle className="truncate px-2 text-sm" data-mask>
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
          <DialogClose
            render={
              <Button
                variant="ghost"
                size="icon"
                className="bg-secondary justify-self-end"
              />
            }
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            <span className="sr-only">Close</span>
          </DialogClose>
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
            className="no-scrollbar scroll-fade min-h-0 flex-1 py-2 text-xs/5 whitespace-pre-wrap [&_code>span]:pl-9 [&_code>span]:-indent-9"
            code={code}
            language={format.language}
            lineNumbers
          />
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
