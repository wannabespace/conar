import type { UITools } from '@conar/shared/ai'
import type { ToolUIPart } from 'ai'
import type { ReactNode } from 'react'
import { SingleAccordion, SingleAccordionContent, SingleAccordionTrigger } from '@conar/ui/components/custom/single-accordion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiErrorWarningLine, RiHammerLine, RiLoader4Line } from '@remixicon/react'
import { AnimatePresence, motion } from 'motion/react'
import { InfoTable } from '~/components/info-table'
import { Monaco } from '~/components/monaco'

function getToolLabel(tool: ToolUIPart<UITools>) {
  if (tool.type === 'tool-columns') {
    if (tool.input) {
      const schema = tool.input.schemaName ? tool.input.schemaName === 'public' ? '' : tool.input.schemaName : ''

      return `Get columns from ${schema ? `"${schema}".` : ''}${tool.input.tableName ? `"${tool.input.tableName}"` : '...'}`
    }
    return 'Get columns from ...'
  }
  if (tool.type === 'tool-enums') {
    return 'Get enums'
  }
  if (tool.type === 'tool-select') {
    if (tool.input) {
      const schema = tool.input.schemaName ? tool.input.schemaName === 'public' ? '' : tool.input.schemaName : ''

      return `Select data from ${schema ? `"${schema}".` : ''}${tool.input.tableName ? `"${tool.input.tableName}"` : '...'}`
    }
    return 'Select data from ...'
  }

  return 'Unknown tool'
}

function getToolDescription(tool: ToolUIPart<UITools>): ReactNode {
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
              { name: 'From', value: `${tool.input.schemaName}.${tool.input.tableName}` },
              { name: 'Where', value: tool.input.whereFilters && Object.keys(tool.input.whereFilters).length
                ? tool.input.whereFilters.map(w => w ? `${w.column} ${w.operator} ${w.value}` : '').filter(Boolean).join(' ')
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

export function ChatMessageTool({ part }: { part: ToolUIPart }) {
  const tool = part as ToolUIPart<UITools>
  const label = getToolLabel(tool)
  const description = getToolDescription(tool)
  const Icon = STATE_ICONS[tool.state]

  return (
    <SingleAccordion className="my-2">
      <SingleAccordionTrigger>
        <span className="flex items-center gap-2">
          <span className="relative flex items-center justify-center size-4 shrink-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={tool.state}
                initial={{ opacity: 0, scale: 0.7, rotate: 20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.7, rotate: -20 }}
                transition={{ duration: 0.1 }}
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
            options={{
              readOnly: true,
              scrollBeyondLastLine: false,
              lineNumbers: 'off',
              minimap: { enabled: false },
              folding: false,
            }}
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
