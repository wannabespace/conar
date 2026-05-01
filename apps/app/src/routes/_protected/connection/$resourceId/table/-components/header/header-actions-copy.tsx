import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { RemixiconComponentType } from '@remixicon/react'
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
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { Monaco } from '~/components/monaco'
import { SidebarButton } from '~/components/sidebar-link'
import * as generators from '~/entities/connection/generators'
import { GENERATOR_COMPATIBILITY } from '~/entities/connection/generators/compatibility'
import { resourceEnumsQueryOptions, resourceIndexesQueryOptions } from '~/entities/connection/queries'
import { Route } from '../..'
import { useTableColumns } from '../../-columns'
import { useTablePageStore } from '../../-store'

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
  generator: typeof generators.generateQueryDrizzle
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

function isFormatCompatible(format: Format, connectionType: ConnectionType) {
  const compat = GENERATOR_COMPATIBILITY[format.type]
  return !compat || compat.includes(connectionType)
}

function DialogSidebar({ activeCategory, activeFormat, formats, onFormatChange, onCategoryChange }: {
  activeCategory: keyof typeof FORMATS
  activeFormat: Format
  formats: Format[]
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
      {formats.map(fmt => (
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

export function HeaderActionsCopy({ table }: { table: string }) {
  const { connection, connectionResource } = Route.useRouteContext()
  const store = useTablePageStore()
  const filters = useSubscription(store, { selector: state => state.filters })
  const columns = useTableColumns()
  const { data: enums } = useQuery(resourceEnumsQueryOptions({ connectionResource }))
  const { data: indexes } = useQuery(resourceIndexesQueryOptions({ connectionResource }))
  const [activeCategory, setActiveCategory] = useState<'schema' | 'query'>('schema')
  const [activeFormatType, setActiveFormatType] = useState<GeneratorFormat>('sql')

  const compatibleFormats = useMemo(
    () => FORMATS[activeCategory].filter(f => isFormatCompatible(f, connection.type)),
    [activeCategory, connection.type],
  )

  const activeFormat = compatibleFormats.find(f => f.type === activeFormatType) ?? compatibleFormats[0]!

  const codeContent = useMemo(() => {
    if (activeFormat.kind === 'schema') {
      return activeFormat.generator({ table, columns, enums: enums ?? [], dialect: connection.type, indexes: indexes ?? [] })
    }

    if (activeFormat.kind === 'query') {
      return activeFormat.generator({ table, filters, dialect: connection.type })
    }

    return ''
  }, [activeFormat, table, columns, filters, enums, indexes, connection.type])

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger render={<Button variant="secondary" size="icon" />}>
            <RiCodeSSlashLine />
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">
          Copy schema / query
        </TooltipContent>
      </Tooltip>
      <DialogContent className={cn(
        `
          flex h-150 w-[60vw] flex-row gap-0 overflow-hidden p-0
          sm:max-w-[60vw]
        `,
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
