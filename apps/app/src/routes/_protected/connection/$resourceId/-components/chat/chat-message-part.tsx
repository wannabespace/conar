import { RiArrowRightSLine, RiBrainLine, RiToolsLine } from '@remixicon/react'
import type { RemixiconComponentType } from '@remixicon/react'
import type { AppMessagePart } from '@tamery/ai/message'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@tamery/ui/components/collapsible'
import { Response, ResponseCodeBlock } from '@tamery/ui/components/response'
import { Spinner } from '@tamery/ui/components/spinner'
import { getToolName, isDynamicToolUIPart, isToolUIPart } from 'ai'
import type { DynamicToolUIPart, ToolUIPart } from 'ai'
import type * as React from 'react'

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
      <RiArrowRightSLine className="size-3.5 transition-transform duration-200 group-data-panel-open:rotate-90" />
      <Icon className="size-3.5" />
      <span className="truncate">{label}</span>
      {status}
    </CollapsibleTrigger>
    <CollapsibleContent className="mt-1 ml-1.5 border-l pl-3">
      {children}
    </CollapsibleContent>
  </Collapsible>
)

const ToolPart = ({ part }: { part: DynamicToolUIPart | ToolUIPart }) => (
  <Disclosure
    icon={RiToolsLine}
    label={getToolName(part)}
    status={
      part.state === 'output-available' ||
      part.state === 'output-error' ? null : (
        <Spinner className="size-3" />
      )
    }
  >
    {part.input !== undefined && (
      <ResponseCodeBlock
        code={JSON.stringify(part.input, null, 2)}
        language="json"
      />
    )}
    {part.state === 'output-available' && part.output !== undefined && (
      <ResponseCodeBlock
        code={JSON.stringify(part.output, null, 2)}
        language="json"
      />
    )}
    {part.state === 'output-error' && (
      <ResponseCodeBlock code={part.errorText} language="text" />
    )}
  </Disclosure>
)

export const MessagePart = ({ part }: { part: AppMessagePart }) => {
  if (isToolUIPart(part) || isDynamicToolUIPart(part)) {
    return <ToolPart part={part} />
  }

  switch (part.type) {
    case 'text': {
      return part.text.trim() ? <Response>{part.text}</Response> : null
    }
    case 'reasoning': {
      return part.text.trim() ? (
        <Disclosure icon={RiBrainLine} label="Reasoning">
          <Response className="text-muted-foreground">{part.text}</Response>
        </Disclosure>
      ) : null
    }
    default: {
      return null
    }
  }
}
