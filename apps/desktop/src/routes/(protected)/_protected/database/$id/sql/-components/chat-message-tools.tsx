import type { UITools } from '@conar/shared/ai'
import type { ToolUIPart } from 'ai'
import type { ReactNode } from 'react'
import { SingleAccordion, SingleAccordionContent, SingleAccordionTrigger } from '@conar/ui/components/custom/single-accordion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiCheckLine, RiErrorWarningLine, RiHammerLine, RiLoader4Line } from '@remixicon/react'
import { InfoTable } from '~/components/info-table'
import { Monaco } from '~/components/monaco'

function getToolLabel(tool: ToolUIPart<UITools>) {
  if (tool.type === 'tool-columns') {
    if (tool.input) {
      return `Get columns for ${tool.input.tableName || '...'}`
    }
    return 'Get columns for ...'
  }
  if (tool.type === 'tool-enums') {
    return 'Get enums'
  }
  if (tool.type === 'tool-query') {
    if (tool.input) {
      return `Execute a SQL query for ${tool.input.tableName || '...'} in ${tool.input.schemaName || '...'}`
    }
    return 'Execute a SQL query for ...'
  }

  throw new Error(`Unknown tool: ${tool}`)
}

function getToolDescription(tool: ToolUIPart<UITools>): ReactNode {
  if (tool.type === 'tool-columns') {
    return 'Agent called a tool to get table columns.'
  }
  if (tool.type === 'tool-enums') {
    return 'Agent called a tool to get database enums.'
  }
  if (tool.type === 'tool-query') {
    return (
      <div className="flex flex-col gap-2">
        <div className="font-medium mb-1">
          Agent called a tool to execute a SQL query.
        </div>
        {tool.input && (
          <InfoTable
            data={[
              { name: 'Table', value: `${tool.input.schemaName}.${tool.input.tableName}` },
              { name: 'Limit', value: tool.input.limit },
              { name: 'Offset', value: tool.input.offset },
              { name: 'Order by', value: Object.keys(tool.input.orderBy || {}).length > 0 ? Object.entries(tool.input.orderBy!).map(([col, dir]) => `${col} ${dir}`).join(', ') : null },
              { name: 'Where', value: tool.input.whereFilters ? tool.input.whereFilters.map(w => w ? `${w.column} ${w.operator} ${w.value}` : '').filter(Boolean).join(' ') : null },
            ]}
          />
        )}
      </div>
    )
  }

  return null
}

const STATE_ICONS: Record<ToolUIPart['state'], (props: { className?: string }) => React.ReactNode> = {
  'input-streaming': ({ className, ...props }) => <RiLoader4Line className={cn('text-yellow-600 animate-spin', className)} {...props} />,
  'input-available': ({ className, ...props }) => <RiCheckLine className={cn('text-green-600', className)} {...props} />,
  'output-available': ({ className, ...props }) => <RiCheckLine className={cn('text-green-600', className)} {...props} />,
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
          {tool.state === 'output-available'
            ? <RiHammerLine className="text-muted-foreground size-4 shrink-0" />
            : (
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
              )}
          {label}
        </span>
      </SingleAccordionTrigger>
      <SingleAccordionContent>
        <div className="text-xs text-muted-foreground mb-4">{description}</div>
        {tool.state === 'output-available' && (
          <Monaco
            value={JSON.stringify(tool.output)}
            language="json"
            options={{
              readOnly: true,
              scrollBeyondLastLine: false,
              lineNumbers: 'off',
              minimap: { enabled: false },
            }}
            className="h-[200px] max-h-[50vh]"
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
