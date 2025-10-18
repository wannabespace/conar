import type { tools } from '@conar/shared/ai-tools'
import type { InferUITools, ToolUIPart } from 'ai'
import type { ReactNode } from 'react'
import { SingleAccordion, SingleAccordionContent, SingleAccordionTrigger } from '@conar/ui/components/custom/single-accordion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiErrorWarningLine, RiHammerLine, RiLoader4Line } from '@remixicon/react'
import { AnimatePresence, motion } from 'motion/react'
import { InfoTable } from '~/components/info-table'
import { Monaco } from '~/components/monaco'

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

  return 'Unknown tool'
}

function getToolDescription(tool: ToolUIPart<InferUITools<typeof tools>>): ReactNode {
  if (tool.type === 'tool-columns') {
    return 'Agent called a tool to get table columns.'
  }
  if (tool.type === 'tool-enums') {
    return 'Agent called a tool to get database enums.'
  }
  if (tool.type === 'tool-select') {
    return (
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
    )
  }

  return null
}

const STATE_ICONS: Record<ToolUIPart['state'], (props: { className?: string }) => React.ReactNode> = {
  'input-streaming': ({ className, ...props }) => <RiLoader4Line className={cn('text-primary animate-spin', className)} {...props} />,
  'input-available': ({ className, ...props }) => <RiLoader4Line className={cn('text-primary animate-spin', className)} {...props} />,
  'output-available': ({ className, ...props }) => <RiHammerLine className={cn('text-muted-foreground', className)} {...props} />,
  'output-error': ({ className, ...props }) => <RiErrorWarningLine className={cn('text-red-600', className)} {...props} />,
}

const STATE_LABELS: Record<ToolUIPart['state'], string> = {
  'input-streaming': 'Waiting for tool response...',
  'input-available': 'Tool response received',
  'output-available': 'Tool response available',
  'output-error': 'Tool call failed',
}

const monacoOptions = {
  readOnly: true,
  scrollBeyondLastLine: false,
  lineNumbers: 'off' as const,
  minimap: { enabled: false },
  folding: false,
}

export function ChatMessageTool({ part, className }: { part: ToolUIPart, className?: string }) {
  const tool = part as ToolUIPart<InferUITools<typeof tools>>
  const label = getToolLabel(tool)
  const description = getToolDescription(tool)
  const Icon = STATE_ICONS[tool.state]

  return (
    <SingleAccordion className={cn('my-4', className)}>
      <SingleAccordionTrigger>
        <span className="flex items-center gap-2">
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
                      <Icon className="size-4 shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {STATE_LABELS[tool.state]}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.span>
            </AnimatePresence>
          </span>
          {label}
        </span>
      </SingleAccordionTrigger>
      <SingleAccordionContent className="pb-0">
        {description && <div className="text-xs text-muted-foreground mb-4">{description}</div>}
        {tool.state === 'output-available' && (
          <Monaco
            value={JSON.stringify(tool.output)}
            language="json"
            options={monacoOptions}
            className="h-[200px] max-h-[50vh] -mx-2"
          />
        )}
        {tool.state === 'input-streaming' && (
          <div className="text-xs text-muted-foreground italic">Waiting for tool response...</div>
        )}
        {tool.state === 'output-error' && (
          <div className="text-xs text-destructive">Tool call failed.</div>
        )}
      </SingleAccordionContent>
    </SingleAccordion>
  )
}
