import { RiArrowRightSLine, RiBrainLine, RiToolsLine } from '@remixicon/react'
import type { RemixiconComponentType } from '@remixicon/react'
import type { AppMessagePart } from '@tamery/ai/v2/message'
import { CodeBlock } from '@tamery/ui/components/code-block'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@tamery/ui/components/collapsible'
import { Response } from '@tamery/ui/components/response'
import { Spinner } from '@tamery/ui/components/spinner'
import type { ToolCallState } from '@tanstack/ai'
import type * as React from 'react'

const TERMINAL_TOOL_STATES = new Set<ToolCallState>(['complete', 'error'])

const jsonText = (value: unknown) => JSON.stringify(value, null, 2)

const Disclosure = ({
  children,
  icon: Icon,
  label,
  status,
}: {
  children: React.ReactNode
  icon: RemixiconComponentType
  label: string
  status?: React.ReactNode
}) => (
  <Collapsible>
    <CollapsibleTrigger className="group text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors">
      <RiArrowRightSLine className="size-3.5 transition-transform duration-200 group-data-[panel-open]:rotate-90" />
      <Icon className="size-3.5" />
      <span className="truncate">{label}</span>
      {status}
    </CollapsibleTrigger>
    <CollapsibleContent className="mt-1 ml-1.5 border-l pl-3">
      {children}
    </CollapsibleContent>
  </Collapsible>
)

const ToolCall = ({
  part,
}: {
  part: Extract<AppMessagePart, { type: 'tool-call' }>
}) => (
  <Disclosure
    icon={RiToolsLine}
    label={part.name}
    status={
      TERMINAL_TOOL_STATES.has(part.state) ? null : (
        <Spinner className="size-3" />
      )
    }
  >
    <CodeBlock
      code={part.input === undefined ? part.arguments : jsonText(part.input)}
      language="json"
    />
    {part.output !== undefined && (
      <CodeBlock code={jsonText(part.output)} language="json" />
    )}
  </Disclosure>
)

export const MessagePart = ({ part }: { part: AppMessagePart }) => {
  switch (part.type) {
    case 'text': {
      return part.content.trim() ? <Response>{part.content}</Response> : null
    }
    case 'thinking': {
      return (
        <Disclosure icon={RiBrainLine} label="Reasoning">
          <Response className="text-muted-foreground">{part.content}</Response>
        </Disclosure>
      )
    }
    case 'tool-call': {
      return <ToolCall part={part} />
    }
    case 'tool-result': {
      return (
        <Disclosure icon={RiToolsLine} label={part.error ?? 'Tool result'}>
          {typeof part.content === 'string' ? (
            <CodeBlock code={part.content} language="text" />
          ) : (
            part.content.map((entry, index) => (
              <MessagePart key={index} part={entry} />
            ))
          )}
        </Disclosure>
      )
    }
    default: {
      return null
    }
  }
}
