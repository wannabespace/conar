import type { ActiveFilter } from '@conar/shared/filters'
import type { RemixiconComponentType } from '@remixicon/react'
import type { databases } from '~/drizzle'
import type { enumType } from '~/entities/database/sql/enums'
import type { Column } from '~/entities/database/utils/table'
import { Button } from '@conar/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@conar/ui/components/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@conar/ui/components/dropdown-menu'
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

const FORMATS = {
  schema: [
    { id: 'sql', label: 'SQL', lang: 'sql', icon: RiDatabase2Line, generator: generators.generateSchemaSQL },
    { id: 'ts', label: 'TypeScript', lang: 'typescript', icon: RiFileCodeLine, generator: generators.generateSchemaTypeScript },
    { id: 'zod', label: 'Zod', lang: 'typescript', icon: RiShieldCheckLine, generator: generators.generateSchemaZod },
    { id: 'prisma', label: 'Prisma', lang: 'graphql', icon: RiTriangleLine, generator: generators.generateSchemaPrisma },
    { id: 'drizzle', label: 'Drizzle', lang: 'typescript', icon: RiDropLine, generator: generators.generateSchemaDrizzle },
    { id: 'kysely', label: 'Kysely', lang: 'typescript', icon: RiTerminalBoxLine, generator: generators.generateSchemaKysely },
  ],
  query: [
    { id: 'sql', label: 'SQL', lang: 'sql', icon: RiDatabase2Line, generator: generators.generateQuerySQL },
    { id: 'prisma', label: 'Prisma', lang: 'typescript', icon: RiTriangleLine, generator: generators.generateQueryPrisma },
    { id: 'drizzle', label: 'Drizzle', lang: 'typescript', icon: RiDropLine, generator: generators.generateQueryDrizzle },
    { id: 'kysely', label: 'Kysely', lang: 'typescript', icon: RiTerminalBoxLine, generator: generators.generateQueryKysely },
  ],
}

interface CopyDialogSidebarProps {
  activeCategory: 'schema' | 'query'
  activeFormatId: string
  onFormatChange: (id: string) => void
}

function CopyDialogSidebar({ activeCategory, activeFormatId, onFormatChange }: CopyDialogSidebarProps) {
  return (
    <div className={`
      flex w-40 flex-col gap-1 overflow-y-auto border-r bg-muted/30 p-2
    `}
    >
      <div className={`
        mb-1 px-2 py-1.5 text-xs font-medium text-muted-foreground
      `}
      >
        {activeCategory === 'schema' ? 'Schema Formats' : 'Query Formats'}
      </div>
      {FORMATS[activeCategory].map((fmt) => {
        const isActive = fmt.id === activeFormatId
        const Icon = fmt.icon
        return (
          <button
            key={fmt.id}
            type="button"
            onClick={() => onFormatChange(fmt.id)}
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
  activeFormat: {
    id: string
    label: string
    lang: string
    icon: RemixiconComponentType
  }
  activeCategory: 'schema' | 'query'
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
          }}
          className="h-full w-full"
        />
      </div>
    </div>
  )
}

const COMPATIBILITY: Record<string, string[]> = {
  prisma: ['postgres', 'mysql', 'mssql'],
  drizzle: ['postgres', 'mysql', 'mssql', 'clickhouse'],
  kysely: ['postgres', 'mysql', 'mssql', 'clickhouse'],
}

export function HeaderActionsCopy({ database, table, schema }: { database: typeof databases.$inferSelect, table: string, schema: string }) {
  const store = usePageStoreContext()
  const filters = useStore(store, state => state.filters)
  const columns = useTableColumns({ database, table, schema })
  const { data: enums } = useDatabaseEnums({ database })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<'schema' | 'query'>('schema')
  const [activeFormatId, setActiveFormatId] = useState<string>('sql')
  const [isCopied, setIsCopied] = useState(false)

  const activeFormat = FORMATS[activeCategory].find(f => f.id === activeFormatId) ?? FORMATS[activeCategory][0]!

  const codeContent = useMemo(() => {
    if (!dialogOpen)
      return ''

    if (COMPATIBILITY[activeFormatId] && !COMPATIBILITY[activeFormatId].includes(database.type)) {
      return `Not supported for ${database.type}`
    }

    if (activeCategory === 'schema') {
      return (activeFormat.generator as (table: string, columns: Column[], enums?: typeof enumType.infer[], dialect?: string) => string)(table, columns, enums, database.type)
    }
    return (activeFormat.generator as (table: string, filters: ActiveFilter[]) => string)(table, filters)
  }, [activeCategory, activeFormat, dialogOpen, table, columns, filters, enums, activeFormatId, database.type])

  const handleOpenDialog = (category: 'schema' | 'query', formatId: string) => {
    setActiveCategory(category)
    setActiveFormatId(formatId)
    setDialogOpen(true)

    const categoryFormats = FORMATS[category]
    const format = categoryFormats.find(f => f.id === formatId) || categoryFormats[0]
    if (format) {
      if (COMPATIBILITY[formatId] && !COMPATIBILITY[formatId].includes(database.type)) {
        navigator.clipboard.writeText(`Not supported for ${database.type}`)
        toast.error(`Not supported for ${database.type}`)
        return
      }

      let text = ''
      if (category === 'schema') {
        text = (format.generator as (table: string, cols: Column[], enums?: typeof enumType.infer[], dialect?: string) => string)(table, columns, enums, database.type)
      }
      else {
        text = (format.generator as (table: string, filters: ActiveFilter[]) => string)(table, filters)
      }
      navigator.clipboard.writeText(text)
      toast.success(`Copied ${format.label} ${category}`)
    }
  }

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
          <CopyDialogSidebar
            activeCategory={activeCategory}
            activeFormatId={activeFormatId}
            onFormatChange={setActiveFormatId}
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

      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <RiCodeSSlashLine />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" align="end">
              Copy schema / query
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Copy Schema</DropdownMenuLabel>
          {FORMATS.schema.map((fmt) => {
            const Icon = fmt.icon
            return (
              <DropdownMenuItem key={fmt.id} onClick={() => handleOpenDialog('schema', fmt.id)}>
                <Icon className="mr-2 h-4 w-4" />
                {fmt.label}
              </DropdownMenuItem>
            )
          })}

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Copy Query</DropdownMenuLabel>
          {FORMATS.query.map((fmt) => {
            const Icon = fmt.icon
            return (
              <DropdownMenuItem key={fmt.id} onClick={() => handleOpenDialog('query', fmt.id)}>
                <Icon className="mr-2 h-4 w-4" />
                {fmt.label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
