import { RiArrowUpLine, RiStopFill } from '@remixicon/react'
import {
  InputGroup,
  InputGroupButton,
  InputGroupTextarea,
} from '@tamery/ui/components/input-group'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useState } from 'react'

export const ChatInput = ({
  isStreaming,
  onSend,
  onStop,
}: {
  isStreaming: boolean
  onSend: (text: string) => void
  onStop: () => void
}) => {
  const [value, setValue] = useState('')

  const submit = () => {
    const text = value.trim()
    if (!text || isStreaming) {
      return
    }
    onSend(text)
    setValue('')
  }

  return (
    <form
      className="shrink-0 p-2"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <InputGroup className="relative">
        <InputGroupTextarea
          data-mask
          aria-label="Message"
          placeholder="Ask about your database…"
          rows={1}
          className="field-sizing-content max-h-64 min-h-20 pb-9"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault()
              submit()
            }
          }}
        />
        <div className="absolute right-1.5 bottom-1.5 flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <InputGroupButton
                  size="icon-xs"
                  variant="default"
                  aria-label={isStreaming ? 'Stop generating' : 'Send message'}
                  className="rounded-full"
                  {...(isStreaming
                    ? { onClick: onStop }
                    : { disabled: !value.trim(), type: 'submit' })}
                />
              }
            >
              {isStreaming ? (
                <RiStopFill className="size-3.5" />
              ) : (
                <RiArrowUpLine className="size-3.5" />
              )}
            </TooltipTrigger>
            <TooltipContent side="top">
              {isStreaming ? 'Stop generating' : 'Send message'}
            </TooltipContent>
          </Tooltip>
        </div>
      </InputGroup>
    </form>
  )
}
