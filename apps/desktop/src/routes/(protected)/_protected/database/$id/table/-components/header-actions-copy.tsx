import type { RemixiconComponentType } from '@remixicon/react'
import type { databases } from '~/drizzle'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { Button } from '@conar/ui/components/button'
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
  RiCheckLine,
  RiClipboardLine,
  RiCloseLine,
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
import { toast } from 'sonner'
import { Monaco } from '~/components/monaco'
import { useDatabaseEnums } from '~/entities/database'
import * as generators from '~/entities/database/utils/generators'
import { useTableColumns } from '../-queries/use-columns-query'
import { usePageStoreContext } from '../-store'

interface Format {
  type: 'sql' | 'ts' | 'zod' | 'prisma' | 'drizzle' | 'kysely'
  label: string
  lang: string
  icon: RemixiconComponentType
  // eslint-disable-next-line ts/no-explicit-any
  generator: (...params: any[]) => string
}

const FORMATS = {
  schema: [
    { type: 'sql', label: 'SQL', lang: 'sql', icon: RiDatabase2Line, generator: generators.generateSchemaSQL },
    { type: 'ts', label: 'TypeScript', lang: 'typescript', icon: RiFileCodeLine, generator: generators.generateSchemaTypeScript },
    { type: 'zod', label: 'Zod', lang: 'typescript', icon: RiShieldCheckLine, generator: generators.generateSchemaZod },
    { type: 'prisma', label: 'Prisma', lang: 'graphql', icon: RiTriangleLine, generator: generators.generateSchemaPrisma },
    { type: 'drizzle', label: 'Drizzle', lang: 'typescript', icon: RiDropLine, generator: generators.generateSchemaDrizzle },
    { type: 'kysely', label: 'Kysely', lang: 'typescript', icon: RiTerminalBoxLine, generator: generators.generateSchemaKysely },
  ],
  query: [
    { type: 'sql', label: 'SQL', lang: 'sql', icon: RiDatabase2Line, generator: generators.generateQuerySQL },
    { type: 'prisma', label: 'Prisma', lang: 'typescript', icon: RiTriangleLine, generator: generators.generateQueryPrisma },
    { type: 'drizzle', label: 'Drizzle', lang: 'typescript', icon: RiDropLine, generator: generators.generateQueryDrizzle },
    { type: 'kysely', label: 'Kysely', lang: 'typescript', icon: RiTerminalBoxLine, generator: generators.generateQueryKysely },
  ],
} satisfies Record<string, Format[]>

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
        onValueChange={(value) => {
          onCategoryChange(value as keyof typeof FORMATS)
          // Keep the same format if it exists in the new category, otherwise use the first one
          const newFormats = FORMATS[value as keyof typeof FORMATS]
          const formatExists = newFormats.some(f => f.type === activeFormat.type)
          if (!formatExists && newFormats.length > 0) {
            onFormatChange(newFormats[0]!.type)
          }
        }}
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
      {FORMATS[activeCategory].map((fmt) => {
        const isActive = fmt.type === activeFormat.type
        const Icon = fmt.icon
        return (
          <button
            key={fmt.type}
            type="button"
            onClick={() => onFormatChange(fmt.type)}
            className={`
              flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left
              text-sm transition-colors
              ${isActive
            ? `bg-primary font-medium text-primary-foreground`
            : `
              text-muted-foreground
              hover:bg-muted hover:text-foreground
            `}
            `}
          >
            <Icon className="h-4 w-4" />
            {fmt.label}
          </button>
        )
      })}
    </div>
  )
}

interface CopyDialogEditorProps {
  activeFormat: Format
  activeCategory: keyof typeof FORMATS
  codeContent: string
  isCopied: boolean
  onCopy: () => void
  onClose: () => void
}

function CopyDialogEditor({ activeFormat, activeCategory, codeContent, isCopied, onCopy, onClose }: CopyDialogEditorProps) {
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
            <Button
              size="sm"
              variant="outline"
              onClick={onCopy}
              className="h-8"
            >
              {isCopied
                ? <RiCheckLine className="mr-2 h-3.5 w-3.5" />
                : <RiClipboardLine className="mr-2 h-3.5 w-3.5" />}
              {isCopied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={onClose}
            >
              <RiCloseLine className="h-4 w-4" />
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
          className="h-full w-full"
        />
      </div>
    </div>
  )
}

const COMPATIBILITY = {
  prisma: [DatabaseType.Postgres, DatabaseType.MySQL, DatabaseType.MSSQL],
  drizzle: [DatabaseType.Postgres, DatabaseType.MySQL, DatabaseType.MSSQL, DatabaseType.ClickHouse],
  kysely: [DatabaseType.Postgres, DatabaseType.MySQL, DatabaseType.MSSQL, DatabaseType.ClickHouse],
} satisfies Partial<Record<Format['type'], DatabaseType[]>>

export function HeaderActionsCopy({ database, table, schema }: { database: typeof databases.$inferSelect, table: string, schema: string }) {
  const store = usePageStoreContext()
  const filters = useStore(store, state => state.filters)
  const columns = useTableColumns({ database, table, schema })
  const { data: enums } = useDatabaseEnums({ database })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<'schema' | 'query'>('schema')
  const [activeFormatType, setActiveFormatType] = useState<Format['type']>('sql')
  const [isCopied, setIsCopied] = useState(false)

  const activeFormat = FORMATS[activeCategory].find(f => f.type === activeFormatType) ?? FORMATS[activeCategory][0]!

  const codeContent = useMemo(() => {
    if (!dialogOpen)
      return ''

    // @ts-expect-error - TODO: fix this
    if (COMPATIBILITY[activeFormatType] && !COMPATIBILITY[activeFormatType].includes(database.type)) {
      return `Not supported for ${database.type}`
    }

    if (activeCategory === 'schema') {
      // @ts-expect-error - TODO: fix this
      return activeFormat.generator(table, columns, enums, database.type)
    }
    // @ts-expect-error - TODO: fix this
    return activeFormat.generator(table, filters)
  }, [activeCategory, activeFormat, dialogOpen, table, columns, filters, enums, activeFormatType, database.type])

  const handleDialogCopy = () => {
    navigator.clipboard.writeText(codeContent)
    setIsCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={cn(
          `
            flex h-[600px] w-[60vw] flex-row gap-0 overflow-hidden p-0
            sm:max-w-[60vw]
          `,
          '[&>button]:hidden',
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
            isCopied={isCopied}
            onCopy={handleDialogCopy}
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
          <TooltipContent side="top" align="end">
            Copy schema / query
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  )
}
