import { cn } from '@conar/ui/lib/utils'
import type * as React from 'react'

export interface MessageProps extends React.ComponentProps<'div'> {
  from: 'user' | 'assistant' | 'system'
}

export function Message({ className, from, ...props }: MessageProps): React.ReactElement {
  return (
    <div
      data-slot="message"
      data-from={from}
      className={cn(
        'group flex w-full animate-in flex-col gap-1 duration-300 fade-in slide-in-from-bottom-2',
        from === 'user' ? 'items-end' : 'items-start',
        className,
      )}
      {...props}
    />
  )
}

export function MessageContent({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      data-slot="message-content"
      className={cn(
        `max-w-[85%] overflow-hidden rounded-2xl text-sm wrap-break-word`,
        `group-data-[from=user]:rounded-br-md group-data-[from=user]:bg-primary group-data-[from=user]:px-3.5 group-data-[from=user]:py-2 group-data-[from=user]:text-primary-foreground`,
        `group-data-[from=assistant]:max-w-full group-data-[from=assistant]:text-foreground`,
        className,
      )}
      {...props}
    />
  )
}
