import type { ToolUI } from '@conar/shared/ai'
import type { ToolUIPart } from 'ai'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@conar/ui/components/accordion'
import { Badge } from '@conar/ui/components/badge'
import { Card } from '@conar/ui/components/card'
import { RiCheckLine, RiErrorWarningLine, RiHammerLine, RiLoader4Line } from '@remixicon/react'
import { Monaco } from '~/components/monaco'

function getToolLabel(tool: ToolUIPart<ToolUI>) {
  if (tool.type === 'tool-columns') {
    if (tool.input) {
      return `Get columns for ${tool.input.tableName}`
    }
    return 'Get columns for ...'
  }
  if (tool.type === 'tool-enums') {
    return 'Get enums'
  }

  throw new Error(`Unknown tool: ${tool}`)
}

const TOOL_DESCRIPTIONS: Record<`tool-${keyof ToolUI}`, string> = {
  'tool-columns': 'Agent called a tool to get table columns.',
  'tool-enums': 'Agent called a tool to get database enums.',
}

const STATE_ICONS: Record<string, React.ReactNode> = {
  'input-streaming': <RiLoader4Line className="text-yellow-600 animate-spin" />,
  'input-available': null,
  'output-available': <RiCheckLine className="text-green-600" />,
  'output-error': <RiErrorWarningLine className="text-red-600" />,
}

const STATE_LABELS: Record<string, string> = {
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
  const tool = part as ToolUIPart<ToolUI>
  const label = getToolLabel(tool)
  const description = TOOL_DESCRIPTIONS[tool.type] || 'Agent called a tool.'

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
            <div className="mb-2 text-xs text-muted-foreground px-4">{description}</div>
            {tool.state === 'output-available' && (
              <Monaco
                value={JSON.stringify(tool.output, null, 2)}
                language="json"
                options={{
                  readOnly: true,
                  scrollBeyondLastLine: false,
                  minimap: { enabled: false },
                }}
                className="h-[200px] "
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
