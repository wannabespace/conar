import {
  ComputerTerminal01Icon,
  DatabaseIcon,
  DropletIcon,
  FileCodeIcon,
  SecurityCheckIcon,
  SourceCodeIcon,
  TriangleIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { Button } from '@tamery/ui/components/button'
import { CopyButton } from '@tamery/ui/components/custom/copy-button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@tamery/ui/components/dialog'
import { Tabs, TabsList, TabsTrigger } from '@tamery/ui/components/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'

import { Monaco } from '~/components/monaco'
import { SidebarButton } from '~/components/sidebar-link'
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
import { resourceEnumsQueryOptions } from '~/entities/connection/queries/enums'
import { resourceIndexesQueryOptions } from '~/entities/connection/queries/indexes'

import { useTableColumnsContext } from '../../../-lib/columns'
import { useTablePageStore } from '../../../-lib/store'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

type Format = {
  type: GeneratorFormat
  label: string
  lang: string
  icon: IconSvgElement
} & (
  | {
      kind: 'schema'
      generator: typeof generateSchemaDrizzle
    }
  | {
      kind: 'query'
      generator: typeof generateQueryDrizzle
    }
)

const FORMATS = {
  schema: [
    {
      kind: 'schema',
      type: 'sql',
      label: 'SQL',
      lang: 'sql',
      icon: DatabaseIcon,
      generator: generateSchemaSQL,
    },
    {
      kind: 'schema',
      type: 'ts',
      label: 'TypeScript',
      lang: 'typescript',
      icon: FileCodeIcon,
      generator: generateSchemaTypeScript,
    },
    {
      kind: 'schema',
      type: 'zod',
      label: 'Zod',
      lang: 'typescript',
      icon: SecurityCheckIcon,
      generator: generateSchemaZod,
    },
    {
      kind: 'schema',
      type: 'prisma',
      label: 'Prisma',
      lang: 'graphql',
      icon: TriangleIcon,
      generator: generateSchemaPrisma,
    },
    {
      kind: 'schema',
      type: 'drizzle',
      label: 'Drizzle',
      lang: 'typescript',
      icon: DropletIcon,
      generator: generateSchemaDrizzle,
    },
    {
      kind: 'schema',
      type: 'kysely',
      label: 'Kysely',
      lang: 'typescript',
      icon: ComputerTerminal01Icon,
      generator: generateSchemaKysely,
    },
  ],
  query: [
    {
      kind: 'query',
      type: 'sql',
      label: 'SQL',
      lang: 'sql',
      icon: DatabaseIcon,
      generator: generateQuerySQL,
    },
    {
      kind: 'query',
      type: 'prisma',
      label: 'Prisma',
      lang: 'typescript',
      icon: TriangleIcon,
      generator: generateQueryPrisma,
    },
    {
      kind: 'query',
      type: 'drizzle',
      label: 'Drizzle',
      lang: 'typescript',
      icon: DropletIcon,
      generator: generateQueryDrizzle,
    },
    {
      kind: 'query',
      type: 'kysely',
      label: 'Kysely',
      lang: 'typescript',
      icon: ComputerTerminal01Icon,
      generator: generateQueryKysely,
    },
  ],
} satisfies { schema: Format[]; query: Format[] }

const isFormatCompatible = (format: Format, connectionType: ConnectionType) => {
  const compat = GENERATOR_COMPATIBILITY[format.type]
  return !compat || compat.includes(connectionType)
}

const DialogSidebar = ({
  activeCategory,
  activeFormat,
  formats,
  onFormatChange,
  onCategoryChange,
}: {
  activeCategory: keyof typeof FORMATS
  activeFormat: Format
  formats: Format[]
  onFormatChange: (id: Format['type']) => void
  onCategoryChange: (category: keyof typeof FORMATS) => void
}) => (
  <div className="bg-body/50 flex w-44 shrink-0 flex-col overflow-y-auto border-r p-2">
    <Tabs
      value={activeCategory}
      onValueChange={(value) => onCategoryChange(value as keyof typeof FORMATS)}
    >
      <TabsList className="w-full">
        <TabsTrigger value="schema" className="flex-1">
          Schema
        </TabsTrigger>
        <TabsTrigger value="query" className="flex-1">
          Query
        </TabsTrigger>
      </TabsList>
    </Tabs>
    <div className="text-2xs text-muted-foreground px-2 pt-3 pb-1 font-semibold tracking-wider uppercase select-none">
      Format
    </div>
    <div className="flex flex-col gap-0.5">
      {formats.map((fmt) => (
        <SidebarButton
          key={fmt.type}
          onClick={() => onFormatChange(fmt.type)}
          active={fmt.type === activeFormat.type}
        >
          <HugeiconsIcon icon={fmt.icon} strokeWidth={2} />
          {fmt.label}
        </SidebarButton>
      ))}
    </div>
  </div>
)

const CopyDialogEditor = ({
  activeFormat,
  activeCategory,
  codeContent,
}: {
  activeFormat: Format
  activeCategory: keyof typeof FORMATS
  codeContent: string
}) => (
  <div className="flex min-w-0 flex-1 flex-col">
    <div className="flex h-12 shrink-0 items-center gap-2 border-b pr-13 pl-4">
      <DialogTitle className="truncate text-sm font-semibold">
        {activeFormat.label} {activeCategory === 'schema' ? 'Schema' : 'Query'}
      </DialogTitle>
      <CopyButton
        className="ml-auto"
        text={codeContent}
        variant="outline"
        size="icon-sm"
      />
    </div>
    <div className="min-h-0 flex-1">
      <Monaco
        value={codeContent}
        language={activeFormat.lang}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          lineNumbers: 'off',
          padding: { top: 12, bottom: 12 },
          scrollBeyondLastLine: false,
        }}
        className="size-full"
      />
    </div>
  </div>
)

export const ActionsCopy = ({
  table,
  trigger,
  open,
  onOpenChange,
}: {
  table: string
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) => {
  const { connection, connectionResource } = useRouteContext()
  const store = useTablePageStore()
  const filters = useSubscription(store, {
    selector: (state) => state.filters,
  })
  const { columns } = useTableColumnsContext()
  const { data: enums } = useQuery(
    resourceEnumsQueryOptions({ connectionResource })
  )
  const { data: indexes } = useQuery(
    resourceIndexesQueryOptions({ connectionResource })
  )
  const [activeCategory, setActiveCategory] = useState<'schema' | 'query'>(
    'schema'
  )
  const [activeFormatType, setActiveFormatType] =
    useState<GeneratorFormat>('sql')

  const compatibleFormats = FORMATS[activeCategory].filter((f) =>
    isFormatCompatible(f, connection.type)
  )

  const matchedFormat = compatibleFormats.find(
    (f) => f.type === activeFormatType
  )
  const activeFormat = matchedFormat ?? compatibleFormats[0]

  const defaultTrigger =
    open === undefined ? (
      <Tooltip>
        <TooltipTrigger
          render={
            <DialogTrigger
              render={<Button variant="secondary" size="icon" />}
            />
          }
        >
          <HugeiconsIcon icon={SourceCodeIcon} strokeWidth={2} />
        </TooltipTrigger>
        <TooltipContent side="top">Copy schema / query</TooltipContent>
      </Tooltip>
    ) : null

  if (!activeFormat) {
    return null
  }

  const codeContent =
    activeFormat.kind === 'schema'
      ? activeFormat.generator({
          table,
          columns,
          enums: enums ?? [],
          dialect: connection.type,
          indexes: indexes ?? [],
        })
      : activeFormat.generator({
          table,
          filters,
          dialect: connection.type,
        })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger render={trigger} /> : defaultTrigger}
      <DialogContent
        className={cn(
          `flex h-[70vh] max-h-140 w-full flex-row gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-3xl`
        )}
      >
        <DialogSidebar
          activeCategory={activeCategory}
          activeFormat={activeFormat}
          formats={compatibleFormats}
          onFormatChange={setActiveFormatType}
          onCategoryChange={setActiveCategory}
        />
        <CopyDialogEditor
          activeFormat={activeFormat}
          activeCategory={activeCategory}
          codeContent={codeContent}
        />
      </DialogContent>
    </Dialog>
  )
}
