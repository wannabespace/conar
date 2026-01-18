import type { ToolUIPart } from '@conar/api/ai/tools/helpers'
import type { editor } from 'monaco-editor'
import type { ReactNode } from 'react'
import {
  SingleAccordion,
  SingleAccordionContent,
  SingleAccordionTrigger,
  SingleAccordionTriggerArrow,
} from '@conar/ui/components/custom/single-accordion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import {
  RiBook2Line,
  RiEarthLine,
  RiErrorWarningLine,
  RiHammerLine,
  RiLoader4Line,
  RiSearchLine,
} from '@remixicon/react'
import {
  useState,
} from 'react'
import { InfoTable } from '~/components/info-table'
import { Monaco } from '~/components/monaco'
import { FaviconWithFallback } from './favicon-with-fallback'

const ICONS: Record<ToolUIPart['state'], (props: { className?: string, part: ToolUIPart }) => React.ReactNode> = {
  'input-streaming': ({ className }) => (
    <RiLoader4Line className={cn(`animate-spin text-primary`, className)} />
  ),
  'input-available': ({ className }) => (
    <RiLoader4Line className={cn(`animate-spin text-primary`, className)} />
  ),
  'output-available': ({ className, part }) => {
    if (part.type === 'tool-webSearch') {
      return <RiEarthLine className={cn('text-muted-foreground', className)} />
    }
    if (part.type === 'tool-resolveLibraryId') {
      return <RiSearchLine className={cn('text-muted-foreground', className)} />
    }
    if (part.type === 'tool-queryDocs') {
      return <RiBook2Line className={cn('text-muted-foreground', className)} />
    }
    return <RiHammerLine className={cn('text-muted-foreground', className)} />
  },
  'output-error': ({ className }) => (
    <RiErrorWarningLine className={cn(`text-red-600`, className)} />
  ),
  'approval-requested': ({ className }) => (
    <RiLoader4Line className={cn(`animate-spin text-primary`, className)} />
  ),
  'approval-responded': ({ className }) => (
    <RiHammerLine className={cn(`text-muted-foreground`, className)} />
  ),
  'output-denied': ({ className }) => (
    <RiErrorWarningLine className={cn(`text-red-600`, className)} />
  ),
}

function getTitle(part: ToolUIPart): React.ReactNode {
  if (part.type === 'tool-columns') {
    if (part.input) {
      const schema = part.input.tableAndSchema?.schemaName ? part.input.tableAndSchema.schemaName === 'public' ? '' : part.input.tableAndSchema.schemaName : ''

      return `Get columns from ${schema ? `"${schema}".` : ''}${part.input.tableAndSchema?.tableName ? `"${part.input.tableAndSchema.tableName}"` : '...'}`
    }
    return 'Get columns from ...'
  }
  if (part.type === 'tool-enums') {
    return 'Get enums'
  }
  if (part.type === 'tool-select') {
    if (part.input) {
      const schema = part.input.tableAndSchema?.schemaName ? part.input.tableAndSchema.schemaName === 'public' ? '' : part.input.tableAndSchema.schemaName : ''

      return `Select data from ${schema ? `"${schema}".` : ''}${part.input.tableAndSchema?.tableName ? `"${part.input.tableAndSchema.tableName}"` : '...'}`
    }
    return 'Select data from ...'
  }
  if (part.type === 'tool-webSearch') {
    if (part.input && typeof part.input === 'object' && 'query' in part.input) {
      const query = typeof part.input.query === 'string' ? part.input.query : ''

      return `Searching the web for "${query}"`
    }
    return 'Searching the web...'
  }

  return 'Unknown tool'
}

const monacoOptions = {
  readOnly: true,
  scrollBeyondLastLine: false,
  lineNumbers: 'off',
  minimap: { enabled: false },
  folding: false,
} as const satisfies editor.IStandaloneEditorConstructionOptions

function extractErrorMessage(output: unknown): string | null {
  if (typeof output !== 'object' || output === null || !('error' in output))
    return null

  const { error } = output

  if (typeof error === 'string')
    return error

  if (error instanceof Error)
    return error.message

  return JSON.stringify(error)
}

function MonacoOutput({ value }: { value: string }) {
  return (
    <Monaco
      value={value}
      language="json"
      options={monacoOptions}
      className="-mx-2 h-[200px] max-h-[50vh]"
    />
  )
}

function ChatMessageToolContent({ part }: { part: ToolUIPart }): ReactNode {
  if (part.type === 'tool-columns') {
    return (
      <>
        <div className="mb-4 text-xs text-muted-foreground">Agent called a tool to get table columns.</div>
        {part.state === 'output-available' && (
          <MonacoOutput value={JSON.stringify(part.output)} />
        )}
      </>
    )
  }

  if (part.type === 'tool-enums') {
    return (
      <>
        <div className="mb-4 text-xs text-muted-foreground">Agent called a tool to get database enums.</div>
        {part.state === 'output-available' && (
          <MonacoOutput value={JSON.stringify(part.output)} />
        )}
      </>
    )
  }

  if (part.type === 'tool-select') {
    return (
      <>
        <div className="flex flex-col gap-2">
          <div className="mb-1 font-medium">
            Agent called a tool to get data from the database.
          </div>
          {part.input && (
            <InfoTable
              data={[
                { name: 'Select', value: part.input.select?.length
                  ? part.input.select.join(', ')
                  : null },
                { name: 'From', value: part.input.tableAndSchema ? `${part.input.tableAndSchema.schemaName}.${part.input.tableAndSchema?.tableName}` : null },
                { name: 'Where', value: (part.state === 'input-available' || part.state === 'output-available') && part.input.whereFilters?.length
                  ? part.input.whereFilters.map(filter => `"${filter.column}" ${filter.operator} ${filter.values.length > 0 ? filter.values.map(value => `"${value}"`).join(', ') : ''}`).join(` ${part.input.whereConcatOperator} `)
                  : null },
                { name: 'Order by', value: part.input.orderBy && Object.keys(part.input.orderBy).length
                  ? Object.entries(part.input.orderBy).map(([col, dir]) => `${col} ${dir}`).join(', ')
                  : null },
                { name: 'Limit', value: part.input.limit },
                { name: 'Offset', value: part.input.offset || null },
              ]}
            />
          )}
        </div>
        {part.state === 'output-available' && (
          <MonacoOutput value={JSON.stringify(part.output)} />
        )}
      </>
    )
  }

  if (part.type === 'tool-webSearch') {
    return (
      <>
        <div className="mb-2 text-xs text-muted-foreground">Agent searched the web for information.</div>
        {part.state === 'output-available' && (
          <div className="space-y-2">
            {!!part.output && typeof part.output === 'object' && 'results' in part.output && Array.isArray(part.output.results) && (
              <div className="flex flex-wrap gap-2">
                {part.output.results.slice(0, 5).map((result: { title: string, url: string, description?: string }) => (
                  <TooltipProvider key={`${part.toolCallId}-${result.url}`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`
                            group flex max-w-full min-w-[200px] flex-1 basis-1/3
                            items-center gap-1 rounded-md border bg-accent/20
                            px-1.5 py-0.5 text-xs transition-colors
                            hover:bg-accent/40
                          `}
                        >
                          <FaviconWithFallback
                            url={result.url}
                            className="size-3 shrink-0"
                          />
                          <span className={`
                            overflow-hidden font-medium text-ellipsis
                            whitespace-nowrap
                            group-hover:text-primary
                          `}
                          >
                            {result.title}
                          </span>
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-w-xs">
                          <div className="font-medium">{result.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{result.url}</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            )}
          </div>
        )}
      </>
    )
  }

  return null
}

export function ChatMessageTool({ part, className }: { part: ToolUIPart, className?: string }) {
  const loading = part.state === 'input-streaming' || part.state === 'input-available'
  const error = part.state === 'output-error' ? extractErrorMessage(part.output) : null

  const Icon = ICONS[part.state]
  const title = getTitle(part)

  const [open, setOpen] = useState(!!error)

  if (!!error && !open) {
    setOpen(true)
  }

  if (loading) {
    return (
      <div className={cn('my-2 flex items-center gap-2 text-sm', className)}>
        <Icon
          className={cn('size-4 shrink-0', loading && `
            animate-spin text-primary
          `)}
          part={part}
        />
        <span className={cn(loading && 'text-muted-foreground')}>
          {title}
        </span>
      </div>
    )
  }

  return (
    <SingleAccordion
      className={cn('my-2', className)}
      open={open}
      onOpenChange={error ? undefined : setOpen}
    >
      <SingleAccordionTrigger className="gap-2 py-2" disabled={!!error}>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Icon className={cn('size-4 shrink-0', !!error && 'text-red-600')} part={part} />
          <span className="truncate text-sm">
            {title}
          </span>
        </div>
        {!error && <SingleAccordionTriggerArrow />}
      </SingleAccordionTrigger>

      <SingleAccordionContent>
        {error
          ? (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground uppercase">
                  Error
                </div>
                <div
                  className={`
                    rounded-md border border-destructive/20 bg-destructive/10
                    px-3 py-2 text-sm text-destructive
                  `}
                  role="alert"
                >
                  {error}
                </div>
              </div>
            )
          : <ChatMessageToolContent part={part} />}
      </SingleAccordionContent>
    </SingleAccordion>
  )
}
