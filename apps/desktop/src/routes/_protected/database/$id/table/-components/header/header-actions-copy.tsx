import type { ActiveFilter } from '@conar/shared/filters'
import type { RemixiconComponentType } from '@remixicon/react'
import type { connections } from '~/drizzle'
import type { GeneratorFormat } from '~/entities/connection/generators/utils'
import { Button } from '@conar/ui/components/button'
import { CopyButton } from '@conar/ui/components/custom/copy-button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  RiCodeSSlashLine,
  RiDatabase2Line,
  RiDropLine,
  RiFileCodeLine,
  RiShieldCheckLine,
  RiTerminalBoxLine,
  RiTriangleLine,
} from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { useMemo, useState } from 'react'
import { Monaco } from '~/components/monaco'
import { SidebarButton } from '~/components/sidebar-link'
import * as generators from '~/entities/connection/generators'
import { GENERATOR_COMPATIBILITY } from '~/entities/connection/generators/compatibility'
import { useConnectionEnums, useConnectionIndexes } from '~/entities/connection/queries'
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

const FORMATS = {
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
} satisfies { schema: Format[], query: Format[] }

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

function CopyDialogEditor({ activeFormat, activeCategory, codeContent }: {
  activeFormat: Format
  activeCategory: keyof typeof FORMATS
  codeContent: string
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <DialogHeader className="border-b p-4 pr-4">
        <DialogTitle>
          {activeFormat.label}
          {' '}
          {activeCategory === 'schema' ? 'Schema' : 'Query'}
        </DialogTitle>
      </DialogHeader>

      <div className="relative min-h-0 flex-1">
        <CopyButton
          className="absolute top-2 right-6 z-10"
          text={codeContent}
          variant="outline"
          size="icon-sm"
        />
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

export function HeaderActionsCopy({ connection, table, schema }: { connection: typeof connections.$inferSelect, table: string, schema: string }) {
  const store = usePageStoreContext()
  const filters = useStore(store, state => state.filters)
  const columns = useTableColumns({ connection, table, schema })
  const { data: enums } = useConnectionEnums({ connection })
  const { data: indexes } = useConnectionIndexes({ connection })
  const [activeCategory, setActiveCategory] = useState<'schema' | 'query'>('schema')
  const [activeFormatType, setActiveFormatType] = useState<GeneratorFormat>('sql')

  const activeFormat = FORMATS[activeCategory].find(f => f.type === activeFormatType) ?? FORMATS[activeCategory][0]!

  const codeContent = useMemo(() => {
    if (GENERATOR_COMPATIBILITY[activeFormatType] && !GENERATOR_COMPATIBILITY[activeFormatType].includes(connection.type)) {
      return `Not supported for ${connection.type}`
    }

    if (activeFormat.kind === 'schema') {
      return activeFormat.generator({ table, columns, enums: enums ?? [], dialect: connection.type, indexes: indexes ?? [] })
    }

    return activeFormat.generator(table, filters)
  }, [activeFormat, table, columns, filters, enums, indexes, activeFormatType, connection.type])

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <DialogTrigger asChild>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon">
                <RiCodeSSlashLine />
              </Button>
            </TooltipTrigger>
          </DialogTrigger>
          <TooltipContent side="top">
            Copy schema / query
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className={cn(
        `
          flex h-[600px] w-[60vw] flex-row gap-0 overflow-hidden p-0
          sm:max-w-[60vw]
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
        />
      </DialogContent>
    </Dialog>
  )
}
