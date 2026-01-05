import type { ToolUIPart } from 'ai'
import type { ReactNode } from 'react'
import type { ToolPart } from './chat-message-tools.utils'
import {
  SingleAccordion,
  SingleAccordionContent,
  SingleAccordionTrigger,
  SingleAccordionTriggerArrow,
} from '@conar/ui/components/custom/single-accordion'
import { cn } from '@conar/ui/lib/utils'
import {
  RiBook2Line,
  RiEarthLine,
  RiErrorWarningLine,
  RiHammerLine,
  RiLoader4Line,
  RiSearchLine,
} from '@remixicon/react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  CompactRow,
  ParametersSection,
  ResponseSection,
  ToolHeaderRow,
} from './chat-message-tools.sections'
import {
  getErrorText,
  getToolStableKey,
  headerText,
  primaryLabel,
  stateTooltip,
} from './chat-message-tools.utils'

const MAX_TOOL_OPEN_ENTRIES = 500
const toolOpenStore = new Map<string, boolean>()

function setToolOpen(stableKey: string, isOpen: boolean) {
  toolOpenStore.set(stableKey, isOpen)
  if (toolOpenStore.size <= MAX_TOOL_OPEN_ENTRIES)
    return
  const firstKey = toolOpenStore.keys().next().value as string | undefined
  if (firstKey)
    toolOpenStore.delete(firstKey)
}

function toToolPart(part: ToolUIPart): ToolPart {
  const unknownPart = part as unknown as Record<string, unknown>
  const hasInput = Object.prototype.hasOwnProperty.call(unknownPart, 'input')
  const hasOutput = Object.prototype.hasOwnProperty.call(unknownPart, 'output')
  return {
    ...(part as ToolUIPart),
    type: (unknownPart.type as ToolPart['type']) ?? 'tool-unknown',
    ...(hasInput ? { input: unknownPart.input } : {}),
    ...(hasOutput ? { output: unknownPart.output } : {}),
  }
}

function usePersistedAccordionOpen(tool: ToolPart) {
  const stableKey = useMemo(() => getToolStableKey(tool), [tool])

  const [open, setOpen] = useState<boolean>(() => {
    const saved = toolOpenStore.get(stableKey)
    if (saved !== undefined)
      return saved
    return tool.state === 'output-error'
  })

  useEffect(() => {
    setToolOpen(stableKey, open)
  }, [stableKey, open])

  const effectiveOpen = tool.state === 'output-error' ? true : open

  const onOpenChange = useCallback((next: boolean) => {
    if (tool.state === 'output-error')
      return
    setOpen(next)
  }, [tool.state])

  return { open: effectiveOpen, onOpenChange }
}

function getStateIconRenderer(state: ToolUIPart['state']) {
  const map: Partial<Record<ToolUIPart['state'], (props: { className?: string, tool: ToolPart }) => ReactNode>> = {
    'input-streaming': ({ className }) => (
      <RiLoader4Line className={cn('animate-spin text-primary', className)} />
    ),
    'input-available': ({ className }) => (
      <RiLoader4Line className={cn('animate-spin text-primary', className)} />
    ),
    'output-available': ({ className, tool }) => {
      if (tool.type === 'tool-webSearch')
        return <RiEarthLine className={cn('text-muted-foreground', className)} />
      if (tool.type === 'tool-resolveLibrary')
        return <RiSearchLine className={cn('text-muted-foreground', className)} />
      if (tool.type === 'tool-getLibraryDocs')
        return <RiBook2Line className={cn('text-muted-foreground', className)} />
      return <RiHammerLine className={cn('text-muted-foreground', className)} />
    },
    'output-error': ({ className }) => (
      <RiErrorWarningLine className={cn('text-red-600', className)} />
    ),
  }
  return map[state] ?? map['input-streaming']!
}

const ChatMessageTool = memo(function ChatMessageTool({ part, className }: { part: ToolUIPart, className?: string }) {
  const tool = toToolPart(part)
  const stableKey = useMemo(() => getToolStableKey(tool), [tool])
  const iconRenderer = useMemo(() => getStateIconRenderer(tool.state), [tool.state])
  const tooltip = stateTooltip(tool.state)
  const header = headerText(tool)
  const label = primaryLabel(tool)
  const errorText = getErrorText(tool)

  const isFetching = tool.state === 'input-streaming' || tool.state === 'input-available'
  const hasDetails = tool.input !== undefined || tool.output !== undefined || Boolean(errorText)
  const { open, onOpenChange } = usePersistedAccordionOpen(tool)

  if (isFetching) {
    return (
      <CompactRow
        tool={tool}
        iconRenderer={iconRenderer}
        tooltip={tooltip}
        text={header}
        className={className}
        subtle
      />
    )
  }

  if (!hasDetails) {
    return (
      <CompactRow
        tool={tool}
        iconRenderer={iconRenderer}
        tooltip={tooltip}
        text={header}
        className={className}
      />
    )
  }

  return (
    <SingleAccordion
      className={cn('my-2 first:mt-0 last:mb-0', className)}
      open={open}
      onOpenChange={onOpenChange}
    >
      <SingleAccordionTrigger className="min-w-0 gap-2 py-2">
        <ToolHeaderRow
          tool={tool}
          iconRenderer={iconRenderer}
          tooltip={tooltip}
          text={header}
          title={label}
        />
        <SingleAccordionTriggerArrow />
      </SingleAccordionTrigger>

      <SingleAccordionContent>
        <div className="mt-2 space-y-4">
          <ResponseSection key={`${stableKey}:response`} tool={tool} errorText={errorText} />
          {tool.input !== undefined && (
            <ParametersSection key={`${stableKey}:params`} input={tool.input} />
          )}
        </div>
      </SingleAccordionContent>
    </SingleAccordion>
  )
})

export { ChatMessageTool }
