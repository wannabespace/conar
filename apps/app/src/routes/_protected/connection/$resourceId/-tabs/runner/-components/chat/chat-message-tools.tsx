import {
  RiBook2Line,
  RiEarthLine,
  RiErrorWarningLine,
  RiHammerLine,
  RiSearchLine,
} from '@remixicon/react'
import type { ToolUIPart } from '@tamery/ai/tools/helpers'
import { FaviconWithFallback } from '@tamery/ui/components/custom/favicon-with-fallback'
import {
  SingleAccordion,
  SingleAccordionContent,
  SingleAccordionTrigger,
  SingleAccordionTriggerArrow,
} from '@tamery/ui/components/custom/single-accordion'
import { Spinner } from '@tamery/ui/components/spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import type { editor } from 'monaco-editor'

import { InfoTable } from '~/components/info-table'
import { Monaco } from '~/components/monaco'

const monacoOptions = {
  readOnly: true,
  scrollBeyondLastLine: false,
  lineNumbers: 'off',
  minimap: { enabled: false },
  folding: false,
} as const satisfies editor.IStandaloneEditorConstructionOptions

const MonacoOutput = ({
  value,
  language = 'json',
}: {
  value: string
  language?: string
}) => (
  <Monaco
    value={value}
    language={language}
    options={monacoOptions}
    className="-mx-2 h-50 max-h-[50vh]"
  />
)

const SKIP_CONTENT_TOOLS = [
  'dynamic-tool',
  'tool-resolveLibraryId',
] satisfies ToolUIPart['type'][]

const shouldSkipContent = (part: ToolUIPart) =>
  SKIP_CONTENT_TOOLS.includes(part.type as (typeof SKIP_CONTENT_TOOLS)[number])

const ICONS: Record<
  ToolUIPart['state'],
  (props: { className?: string; part: ToolUIPart }) => React.ReactNode
> = {
  'input-streaming': ({ className }) => (
    <Spinner className={cn(`text-primary animate-spin`, className)} />
  ),
  'input-available': ({ className }) => (
    <Spinner className={cn(`text-primary animate-spin`, className)} />
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
    <Spinner className={cn(`text-primary animate-spin`, className)} />
  ),
  'approval-responded': ({ className }) => (
    <RiHammerLine className={cn(`text-muted-foreground`, className)} />
  ),
  'output-denied': ({ className }) => (
    <RiErrorWarningLine className={cn(`text-red-600`, className)} />
  ),
}

const ToolIcon = ({
  part,
  className,
}: {
  part: ToolUIPart
  className?: string
}) => ICONS[part.state]({ part, className })

const TITLES: {
  [K in ToolUIPart['type']]: (props: {
    part: Extract<ToolUIPart, { type: K }>
  }) => string
} = {
  'dynamic-tool': ({ part }) => part.title || part.toolName,
  'tool-columns': ({ part }) => {
    if (part.input) {
      const schemaName = part.input.tableAndSchema?.schemaName
      const schema = schemaName && schemaName !== 'public' ? schemaName : ''

      return `Get columns from ${schema ? `"${schema}".` : ''}${part.input.tableAndSchema?.tableName ? `"${part.input.tableAndSchema.tableName}"` : '...'}`
    }
    return 'Get columns from ...'
  },
  'tool-enums': () => 'Get enums',
  'tool-select': ({ part }) => {
    if (part.input) {
      const schemaName = part.input.tableAndSchema?.schemaName
      const schema = schemaName && schemaName !== 'public' ? schemaName : ''

      return `Select data from ${schema ? `"${schema}".` : ''}${part.input.tableAndSchema?.tableName ? `"${part.input.tableAndSchema.tableName}"` : '...'}`
    }
    return 'Select data from ...'
  },
  'tool-webSearch': ({ part }) => {
    const query = typeof part.input?.query === 'string' ? part.input?.query : ''
    if (query) {
      return `Searching the web for "${query}"`
    }
    return 'Searching the web...'
  },
  'tool-resolveLibraryId': ({ part }) => {
    const libraryName =
      part.input && typeof part.input.libraryName === 'string'
        ? part.input.libraryName
        : ''

    if (libraryName) {
      return `Resolved library "${libraryName}"`
    }

    return 'Resolving library name...'
  },
  'tool-queryDocs': ({ part }) => {
    const query = typeof part.input?.query === 'string' ? part.input?.query : ''

    if (query) {
      return `Querying docs for "${query}"`
    }
    return 'Querying docs...'
  },
}

const getTitle = ({ part }: { part: ToolUIPart }) =>
  // oxlint-disable-next-line ts/no-explicit-any
  TITLES[part.type]({ part } as any) || 'Unknown tool'

const CONTENT: {
  [
    K in Exclude<ToolUIPart['type'], (typeof SKIP_CONTENT_TOOLS)[number]>
  ]: (props: { part: Extract<ToolUIPart, { type: K }> }) => React.ReactNode
} = {
  'tool-columns': ({ part }) => (
    <>
      <div className="text-muted-foreground mb-4 text-xs">
        Agent called a tool to get table columns.
      </div>
      {part.state === 'output-available' && (
        <MonacoOutput value={JSON.stringify(part.output)} />
      )}
    </>
  ),
  'tool-enums': ({ part }) => (
    <>
      <div className="text-muted-foreground mb-4 text-xs">
        Agent called a tool to get database enums.
      </div>
      {part.state === 'output-available' && (
        <MonacoOutput value={JSON.stringify(part.output)} />
      )}
    </>
  ),
  'tool-select': ({ part }) => (
    <div className="flex flex-col gap-2 text-xs">
      <div className="text-muted-foreground">
        Agent called a tool to get data from the database.
      </div>
      {part.input && (
        <InfoTable
          data={[
            {
              name: 'Select',
              value: part.input.select?.length
                ? part.input.select.join(', ')
                : null,
            },
            {
              name: 'From',
              value: part.input.tableAndSchema
                ? `${part.input.tableAndSchema.schemaName}.${part.input.tableAndSchema?.tableName}`
                : null,
            },
            {
              name: 'Where',
              value:
                (part.state === 'input-available' ||
                  part.state === 'output-available') &&
                part.input.whereFilters?.length
                  ? part.input.whereFilters
                      .map(
                        (filter) =>
                          `"${filter.column}" ${filter.operator} ${filter.values.length > 0 ? filter.values.map((value) => `"${value}"`).join(', ') : ''}`
                      )
                      .join(` ${part.input.whereConcatOperator} `)
                  : null,
            },
            {
              name: 'Order by',
              value:
                part.input.orderBy && Object.keys(part.input.orderBy).length
                  ? Object.entries(part.input.orderBy)
                      .map(([col, dir]) => `${col} ${dir}`)
                      .join(', ')
                  : null,
            },
            { name: 'Limit', value: part.input.limit },
            { name: 'Offset', value: part.input.offset || null },
          ]}
        />
      )}
      {part.state === 'output-available' && (
        <MonacoOutput value={JSON.stringify(part.output)} />
      )}
    </div>
  ),
  'tool-webSearch': ({ part }) => (
    <>
      <div className="text-muted-foreground mb-2 text-xs">
        Agent searched the web for information.
      </div>
      {part.state === 'output-available' && (
        <div className="space-y-2">
          {!!part.output &&
            typeof part.output === 'object' &&
            'results' in part.output &&
            Array.isArray(part.output.results) && (
              <div className="flex flex-wrap gap-2">
                {part.output.results
                  .slice(0, 5)
                  .map(
                    (result: {
                      title: string
                      url: string
                      description?: string
                    }) => (
                      <Tooltip key={`${part.toolCallId}-${result.url}`}>
                        <TooltipTrigger
                          render={
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={result.title}
                              className="group bg-muted hover:bg-accent flex max-w-full min-w-50 flex-1 basis-1/3 items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs transition-colors"
                            />
                          }
                        >
                          <FaviconWithFallback
                            url={result.url}
                            className="size-3 shrink-0"
                          />
                          <span className="group-hover:text-primary truncate font-medium">
                            {result.title}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-xs">
                            <div className="font-medium">{result.title}</div>
                            <div className="text-muted-foreground mt-1 text-xs">
                              {result.url}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )
                  )}
              </div>
            )}
        </div>
      )}
    </>
  ),
  'tool-queryDocs': ({ part }) => (
    <MonacoOutput value={part.output || ''} language="markdown" />
  ),
}

const ToolContent = ({ part }: { part: ToolUIPart }) =>
  CONTENT[
    part.type as Exclude<
      ToolUIPart['type'],
      (typeof SKIP_CONTENT_TOOLS)[number]
    >
  ]?.({
    part,
    // oxlint-disable-next-line ts/no-explicit-any
  } as any) ||
  (part.errorText ? (
    <div className="text-destructive text-xs">{part.errorText}</div>
  ) : (
    <MonacoOutput value={JSON.stringify(part.output)} />
  ))

const extractErrorMessage = (part: ToolUIPart): string | null => {
  if (part.errorText) {
    return part.errorText
  }

  const { output } = part

  if (typeof output !== 'object' || output === null || !('error' in output)) {
    return null
  }

  const { error } = output

  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  return JSON.stringify(error)
}

export const ChatMessageTool = ({
  part,
  className,
}: {
  part: ToolUIPart
  className?: string
}) => {
  const error = part.state === 'output-error' ? extractErrorMessage(part) : null
  const skipContent = shouldSkipContent(part)

  const title = getTitle({ part })

  return (
    <SingleAccordion
      className={cn('my-2 rounded-sm', className)}
      open={error ? true : undefined}
    >
      <SingleAccordionTrigger
        className={cn(
          'min-w-0 gap-2 overflow-hidden py-1 text-xs',
          (skipContent || error) && `cursor-auto`
        )}
      >
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          <ToolIcon
            className={cn('size-4 shrink-0', error && 'text-destructive')}
            part={part}
          />
          <span className="truncate text-sm">{title}</span>
        </div>
        {!error && !skipContent && (
          <SingleAccordionTriggerArrow className="ml-auto shrink-0" />
        )}
      </SingleAccordionTrigger>
      <SingleAccordionContent>
        {error ? <div className="text-destructive text-xs">{error}</div> : null}
        {!error && !skipContent ? <ToolContent part={part} /> : null}
      </SingleAccordionContent>
    </SingleAccordion>
  )
}
