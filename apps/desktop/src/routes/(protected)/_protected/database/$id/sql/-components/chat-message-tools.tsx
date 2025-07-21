import type { UITools } from '@conar/shared/ai'
import type { ToolUIPart } from 'ai'
import type { ReactNode } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@conar/ui/components/accordion'
import { Badge } from '@conar/ui/components/badge'
import { Card } from '@conar/ui/components/card'
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

const STATE_ICONS: Record<ToolUIPart['state'], React.ReactNode> = {
  'input-streaming': <RiLoader4Line className="text-yellow-600 animate-spin" />,
  'input-available': <RiCheckLine className="text-green-600" />,
  'output-available': <RiCheckLine className="text-green-600" />,
  'output-error': <RiErrorWarningLine className="text-red-600" />,
}

const STATE_LABELS: Record<ToolUIPart['state'], string> = {
  'input-streaming': 'Waiting',
  'input-available': 'Ready',
  'output-available': 'Success',
  'output-error': 'Failed',
}

function ToolStateBadge({ state }: { state: ToolUIPart['state'] }) {
  return (
    <Badge
      variant="secondary"
      className="flex items-center gap-1"
    >
      {STATE_ICONS[state] || null}
      <span>{STATE_LABELS[state] || state.replace(/-/g, ' ')}</span>
    </Badge>
  )
}

export function ChatMessageTool({ part }: { part: ToolUIPart }) {
  const tool = part as ToolUIPart<UITools>
  const label = getToolLabel(tool)
  const description = getToolDescription(tool)

  return (
    <Card className="my-2">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="tool-call">
          <AccordionTrigger className="px-4 py-3 hover:no-underline cursor-pointer items-center">
            <span className="flex items-center leading-none gap-2">
              <RiHammerLine className="text-muted-foreground size-4 shrink-0" />
              {label}
              <ToolStateBadge state={tool.state} />
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <div className="text-xs text-muted-foreground mb-4 px-4">{description}</div>
            {tool.state === 'output-available' && (
              <Monaco
                value={JSON.stringify(tool.output)}
                language="json"
                options={{
                  readOnly: true,
                  scrollBeyondLastLine: false,
                  minimap: { enabled: false },
                }}
                className="h-[200px]"
              />
            )}
            {tool.state === 'input-streaming' && (
              <div className="text-xs text-muted-foreground italic">Waiting for tool response...</div>
            )}
            {tool.state === 'output-error' && (
              <div className="text-xs text-destructive">Tool call failed.</div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}
