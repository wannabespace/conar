import type { ActiveFilter } from '@conar/shared/filters'
import type { RemixiconComponentType } from '@remixicon/react'
import type { connections } from '~/drizzle'
import type { GeneratorFormat } from '~/entities/connection/utils/types'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { Button } from '@conar/ui/components/button'
import { CopyButton } from '@conar/ui/components/custom/copy-button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@conar/ui/components/dialog'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@conar/ui/components/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import {
  RiCloseLine,
  RiCodeSSlashLine,
  RiDatabase2Line,
  RiDropLine,
  RiFileCodeLine,
  RiFileCopyLine,
  RiShieldCheckLine,
  RiTerminalBoxLine,
  RiTriangleLine,
} from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { useMemo, useState } from 'react'
import { Monaco } from '~/components/monaco'
import { SidebarButton } from '~/components/sidebar-link'
import { useConnectionEnums, useConnectionIndexes } from '~/entities/connection/queries'
import * as generators from '~/entities/connection/utils/generators'
import { useTableColumns } from '../../-queries/use-columns-query'
import { usePageStoreContext } from '../../-store'

type Format = {
  type: GeneratorFormat
  label: string
  lang: string
  icon: RemixiconComponentType
} & ({
  kind: 'schema'
  generator: typeof generators.generateSchemaDrizzle
} | {
  kind: 'query'
  generator: (table: string, filters: ActiveFilter[]) => string
})

const FORMATS: { schema: Format[], query: Format[] } = {
  schema: [
    { kind: 'schema', type: 'sql', label: 'SQL', lang: 'sql', icon: RiDatabase2Line, generator: generators.generateSchemaSQL },
    { kind: 'schema', type: 'ts', label: 'TypeScript', lang: 'typescript', icon: RiFileCodeLine, generator: generators.generateSchemaTypeScript },
    { kind: 'schema', type: 'zod', label: 'Zod', lang: 'typescript', icon: RiShieldCheckLine, generator: generators.generateSchemaZod },
    { kind: 'schema', type: 'prisma', label: 'Prisma', lang: 'graphql', icon: RiTriangleLine, generator: generators.generateSchemaPrisma },
    { kind: 'schema', type: 'drizzle', label: 'Drizzle', lang: 'typescript', icon: RiDropLine, generator: generators.generateSchemaDrizzle },
    { kind: 'schema', type: 'kysely', label: 'Kysely', lang: 'typescript', icon: RiTerminalBoxLine, generator: generators.generateSchemaKysely },
  ],
  query: [
    { kind: 'query', type: 'sql', label: 'SQL', lang: 'sql', icon: RiDatabase2Line, generator: generators.generateQuerySQL },
    { kind: 'query', type: 'prisma', label: 'Prisma', lang: 'typescript', icon: RiTriangleLine, generator: generators.generateQueryPrisma },
    { kind: 'query', type: 'drizzle', label: 'Drizzle', lang: 'typescript', icon: RiDropLine, generator: generators.generateQueryDrizzle },
    { kind: 'query', type: 'kysely', label: 'Kysely', lang: 'typescript', icon: RiTerminalBoxLine, generator: generators.generateQueryKysely },
  ],
}

function DialogSidebar({ activeCategory, activeFormat, onFormatChange, onCategoryChange }: {
  activeCategory: keyof typeof FORMATS
  activeFormat: Format
  onFormatChange: (id: Format['type']) => void
  onCategoryChange: (category: keyof typeof FORMATS) => void
}) {
  return (
    <div className={`
      flex w-40 flex-col gap-1 overflow-y-auto border-r bg-muted/30 p-2
    `}
    >
      <Tabs
        value={activeCategory}
        onValueChange={value => onCategoryChange(value as keyof typeof FORMATS)}
        className="mb-2"
      >
        <TabsList className="w-full">
          <TabsTrigger value="schema" className="flex-1">Schema</TabsTrigger>
          <TabsTrigger value="query" className="flex-1">Query</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className={`
        mb-1 px-2 py-1.5 text-xs font-medium text-muted-foreground
      `}
      >
        {activeCategory === 'schema' ? 'Schema Formats' : 'Query Formats'}
      </div>
      {FORMATS[activeCategory].map(fmt => (
        <SidebarButton
          key={fmt.type}
          onClick={() => onFormatChange(fmt.type)}
          active={fmt.type === activeFormat.type}
        >
          <fmt.icon className="size-4" />
          {fmt.label}
        </SidebarButton>
      ))}
    </div>
  )
}

function CopyDialogEditor({ activeFormat, activeCategory, codeContent, onClose }: {
  activeFormat: Format
  activeCategory: keyof typeof FORMATS
  codeContent: string
  onClose: () => void
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <DialogHeader className="border-b p-4 pr-4">
        <DialogTitle className="flex items-center justify-between">
          <span>
            {activeFormat.label}
            {' '}
            {activeCategory === 'schema' ? 'Schema' : 'Query'}
          </span>
          <div className="flex items-center gap-2">
            <CopyButton
              text={codeContent}
              variant="outline"
              size="sm"
            >
              <span className="flex items-center gap-2">
                <RiFileCopyLine className="size-4" />
                Copy
              </span>
            </CopyButton>
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={onClose}
            >
              <RiCloseLine className="size-4" />
            </Button>
          </div>
        </DialogTitle>
      </DialogHeader>

      <div className="relative min-h-0 flex-1">
        <Monaco
          value={codeContent}
          language={activeFormat.lang}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'off',
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
          }}
          className="size-full"
        />
      </div>
    </div>
  )
}

const COMPATIBILITY: Partial<Record<GeneratorFormat, ConnectionType[]>> = {
  prisma: [ConnectionType.Postgres, ConnectionType.MySQL, ConnectionType.MSSQL],
  drizzle: [ConnectionType.Postgres, ConnectionType.MySQL, ConnectionType.MSSQL, ConnectionType.ClickHouse],
  kysely: [ConnectionType.Postgres, ConnectionType.MySQL, ConnectionType.MSSQL, ConnectionType.ClickHouse],
}

export function HeaderActionsCopy({ connection, table, schema }: { connection: typeof connections.$inferSelect, table: string, schema: string }) {
  const store = usePageStoreContext()
  const filters = useStore(store, state => state.filters)
  const columns = useTableColumns({ connection, table, schema })
  const { data: enums } = useConnectionEnums({ connection })
  const { data: indexes } = useConnectionIndexes({ connection })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<'schema' | 'query'>('schema')
  const [activeFormatType, setActiveFormatType] = useState<GeneratorFormat>('sql')

  const activeFormat = FORMATS[activeCategory].find(f => f.type === activeFormatType) ?? FORMATS[activeCategory][0]!

  const codeContent = useMemo(() => {
    if (!dialogOpen)
      return ''

    if (COMPATIBILITY[activeFormatType] && !COMPATIBILITY[activeFormatType].includes(connection.type)) {
      return `Not supported for ${connection.type}`
    }

    if (activeFormat.kind === 'schema') {
      return activeFormat.generator({ table, columns, enums: enums ?? [], dialect: connection.type, indexes: indexes ?? [] })
    }

    return activeFormat.generator(table, filters)
  }, [activeFormat, dialogOpen, table, columns, filters, enums, indexes, activeFormatType, connection.type])

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={cn(
          `
            flex h-[600px] w-[60vw] flex-row gap-0 overflow-hidden p-0
            sm:max-w-[60vw]
            [&>button]:hidden
          `,
        )}
        >
          <DialogSidebar
            activeCategory={activeCategory}
            activeFormat={activeFormat}
            onFormatChange={setActiveFormatType}
            onCategoryChange={setActiveCategory}
          />
          <CopyDialogEditor
            activeFormat={activeFormat}
            activeCategory={activeCategory}
            codeContent={codeContent}
            onClose={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDialogOpen(true)}
            >
              <RiCodeSSlashLine />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            Copy schema / query
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  )
}
