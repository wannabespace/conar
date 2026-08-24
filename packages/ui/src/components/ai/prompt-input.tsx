import { Button } from '@conar/ui/components/button'
import { Spinner } from '@conar/ui/components/spinner'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowUpLine, RiStopFill } from '@remixicon/react'
import type * as React from 'react'

export function PromptInput({
  className,
  ...props
}: React.ComponentProps<'form'>): React.ReactElement {
  return (
    <form
      data-slot="prompt-input"
      className={cn(
        `relative flex w-full flex-col gap-2 rounded-2xl border border-input bg-background p-2 shadow-xs/5 transition-shadow focus-within:border-ring focus-within:ring-[0.1875rem] focus-within:ring-ring/24 dark:bg-input/32`,
        className,
      )}
      {...props}
    />
  )
}

export function PromptInputTextarea({
  className,
  onKeyDown,
  ...props
}: React.ComponentProps<'textarea'>): React.ReactElement {
  return (
    <textarea
      data-slot="prompt-input-textarea"
      rows={1}
      className={cn(
        'field-sizing-content max-h-40 w-full resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground',
        className,
      )}
      onKeyDown={event => {
        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
          event.preventDefault()
          event.currentTarget.form?.requestSubmit()
        }

        onKeyDown?.(event)
      }}
      {...props}
    />
  )
}

export function PromptInputToolbar({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      data-slot="prompt-input-toolbar"
      className={cn('flex items-center justify-between gap-2', className)}
      {...props}
    />
  )
}

export interface PromptInputSubmitProps extends React.ComponentProps<typeof Button> {
  status?: 'ready' | 'streaming'
}

export function PromptInputSubmit({
  className,
  status = 'ready',
  ...props
}: PromptInputSubmitProps): React.ReactElement {
  return (
    <Button
      data-slot="prompt-input-submit"
      type={status === 'streaming' ? 'button' : 'submit'}
      size="icon-sm"
      className={cn('rounded-full', className)}
      aria-label={status === 'streaming' ? 'Stop' : 'Send'}
      {...props}
    >
      {status === 'streaming' ? <RiStopFill /> : <RiArrowUpLine />}
    </Button>
  )
}

export function PromptInputLoader({
  className,
  ...props
}: React.ComponentProps<typeof Spinner>): React.ReactElement {
  return <Spinner className={cn('size-4 text-muted-foreground', className)} {...props} />
}
