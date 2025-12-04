import type { tools } from '@conar/api/src/ai-tools'
import type { InferUITools, ToolUIPart } from 'ai'
import type { ReactNode } from 'react'
import { SingleAccordion, SingleAccordionContent, SingleAccordionTrigger } from '@conar/ui/components/custom/single-accordion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiEarthLine, RiErrorWarningLine, RiHammerLine, RiLoader4Line } from '@remixicon/react'
import { AnimatePresence, motion } from 'motion/react'
import { InfoTable } from '~/components/info-table'
import { Monaco } from '~/components/monaco'
import { FaviconWithFallback } from './favicon-with-fallback'

function getToolLabel(tool: ToolUIPart<InferUITools<typeof tools>>) {
  if (tool.type === 'tool-columns') {
    if (tool.input) {
      const schema = tool.input.tableAndSchema?.schemaName ? tool.input.tableAndSchema.schemaName === 'public' ? '' : tool.input.tableAndSchema.schemaName : ''

      return `Get columns from ${schema ? `"${schema}".` : ''}${tool.input.tableAndSchema?.tableName ? `"${tool.input.tableAndSchema.tableName}"` : '...'}`
    }
    return 'Get columns from ...'
  }
  if (tool.type === 'tool-enums') {
    return 'Get enums'
  }
  if (tool.type === 'tool-select') {
    if (tool.input) {
      const schema = tool.input.tableAndSchema?.schemaName ? tool.input.tableAndSchema.schemaName === 'public' ? '' : tool.input.tableAndSchema.schemaName : ''

      return `Select data from ${schema ? `"${schema}".` : ''}${tool.input.tableAndSchema?.tableName ? `"${tool.input.tableAndSchema.tableName}"` : '...'}`
    }
    return 'Select data from ...'
  }
  if (tool.type === 'tool-webSearch') {
    if (tool.input && typeof tool.input === 'object' && 'query' in tool.input) {
      const query = typeof tool.input.query === 'string' ? tool.input.query : ''

      return `Searching the web for "${query}"`
    }
    return 'Searching the web...'
  }

  return 'Unknown tool'
}

const monacoOptions = {
  readOnly: true,
  scrollBeyondLastLine: false,
  lineNumbers: 'off' as const,
  minimap: { enabled: false },
  folding: false,
}

function MonacoOutput({ value }: { value: string }) {
  return (
    <Monaco
      value={value}
      language="json"
      options={monacoOptions}
      className="h-[200px] max-h-[50vh] -mx-2"
    />
  )
}

function ToolDescription({ tool }: { tool: ToolUIPart<InferUITools<typeof tools>> }): ReactNode {
  if (tool.type === 'tool-columns') {
    return (
      <>
        <div className="text-xs text-muted-foreground mb-4">Agent called a tool to get table columns.</div>
        {tool.state === 'output-available' && (
          <MonacoOutput value={JSON.stringify(tool.output)} />
        )}
      </>
    )
  }

  if (tool.type === 'tool-enums') {
    return (
      <>
        <div className="text-xs text-muted-foreground mb-4">Agent called a tool to get database enums.</div>
        {tool.state === 'output-available' && (
          <MonacoOutput value={JSON.stringify(tool.output)} />
        )}
      </>
    )
  }

  if (tool.type === 'tool-select') {
    return (
      <>
        <div className="flex flex-col gap-2">
          <div className="font-medium mb-1">
            Agent called a tool to get data from the database.
          </div>
          {tool.input && (
            <InfoTable
              data={[
                { name: 'Select', value: tool.input.select?.length
                  ? tool.input.select.join(', ')
                  : null },
                { name: 'From', value: tool.input.tableAndSchema ? `${tool.input.tableAndSchema.schemaName}.${tool.input.tableAndSchema?.tableName}` : null },
                { name: 'Where', value: (tool.state === 'input-available' || tool.state === 'output-available') && tool.input.whereFilters?.length
                  ? tool.input.whereFilters.map(filter => `"${filter.column}" ${filter.operator} ${filter.values.length > 0 ? filter.values.map(value => `"${value}"`).join(', ') : ''}`).join(` ${tool.input.whereConcatOperator} `)
                  : null },
                { name: 'Order by', value: tool.input.orderBy && Object.keys(tool.input.orderBy).length
                  ? Object.entries(tool.input.orderBy).map(([col, dir]) => `${col} ${dir}`).join(', ')
                  : null },
                { name: 'Limit', value: tool.input.limit },
                { name: 'Offset', value: tool.input.offset || null },
              ]}
            />
          )}
        </div>
        {tool.state === 'output-available' && (
          <MonacoOutput value={JSON.stringify(tool.output)} />
        )}
      </>
    )
  }

  if (tool.type === 'tool-webSearch') {
    return (
      <>
        <div className="text-xs text-muted-foreground mb-2">Agent searched the web for information.</div>
        {tool.state === 'output-available' && (
          <div className="space-y-2">
            {!!tool.output && typeof tool.output === 'object' && 'results' in tool.output && Array.isArray(tool.output.results) && (
              <div className="flex flex-wrap gap-2">
                {tool.output.results.slice(0, 5).map((result: { title: string, url: string, description?: string }, index: number) => {
                  const hostname = (() => {
                    try {
                      return new URL(result.url).hostname
                    }
                    catch {
                      return ''
                    }
                  })()

                  const displayText = result.title || hostname.replace('www.', '')

                  return (
                    <TooltipProvider key={`${tool.toolCallId}-${index}`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-1.5 py-0.5 text-xs bg-accent/20 hover:bg-accent/40 rounded-md border transition-colors group min-w-0 max-w-full"
                          >
                            <FaviconWithFallback hostname={hostname} />
                            <span className="font-medium group-hover:text-primary overflow-hidden text-ellipsis whitespace-nowrap">
                              {displayText}
                            </span>
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-xs">
                            <div className="font-medium">{displayText}</div>
                            <div className="text-xs text-muted-foreground mt-1">{result.url}</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </>
    )
  }

  return null
}

const STATE_ICONS: Record<ToolUIPart['state'], (props: { className?: string, tool: ToolUIPart<InferUITools<typeof tools>> }) => React.ReactNode> = {
  'input-streaming': ({ className }) => <RiLoader4Line className={cn('text-primary animate-spin', className)} />,
  'input-available': ({ className }) => <RiLoader4Line className={cn('text-primary animate-spin', className)} />,
  'output-available': ({ className, tool }) => {
    if (tool.type === 'tool-webSearch') {
      return <RiEarthLine className={cn('text-muted-foreground', className)} />
    }
    return <RiHammerLine className={cn('text-muted-foreground', className)} />
  },
  'output-error': ({ className }) => <RiErrorWarningLine className={cn('text-red-600', className)} />,
}

const STATE_LABELS: Record<ToolUIPart['state'], string> = {
  'input-streaming': 'Waiting for tool response...',
  'input-available': 'Tool response received',
  'output-available': 'Tool response available',
  'output-error': 'Tool call failed',
}

export function ChatMessageTool({ part, className }: { part: ToolUIPart, className?: string }) {
  const tool = part as ToolUIPart<InferUITools<typeof tools>>
  const label = getToolLabel(tool)
  const Icon = STATE_ICONS[tool.state]

  return (
    <SingleAccordion className={cn('my-4 first:mt-0 last:mb-0', className)}>
      <SingleAccordionTrigger className="min-w-0 gap-2">
        <span className="relative flex items-center justify-center size-4 shrink-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={tool.state}
              initial={{ opacity: 0, scale: 0.8, rotate: 10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Icon tool={tool} className="size-4 shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    {STATE_LABELS[tool.state]}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.span>
          </AnimatePresence>
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left">
                {label}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </SingleAccordionTrigger>
      <SingleAccordionContent>
        <ToolDescription tool={tool} />
        {tool.state === 'input-streaming' && (
          <div className="text-xs text-muted-foreground italic">
            {tool.type === 'tool-webSearch' ? 'Searching the web...' : 'Waiting for tool response...'}
          </div>
        )}
        {tool.state === 'output-error' && (
          <div className="text-xs text-destructive">Tool call failed.</div>
        )}
      </SingleAccordionContent>
    </SingleAccordion>
  )
}
