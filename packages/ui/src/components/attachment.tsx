import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { Button } from '@tamery/ui/components/button'
import { cn } from '@tamery/ui/lib/utils'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { attachmentMediaVariants, attachmentVariants } from './attachment.utils'

const Attachment = ({
  className,
  state = 'done',
  size = 'default',
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof attachmentVariants> & {
    state?: 'idle' | 'uploading' | 'processing' | 'error' | 'done'
  }) => (
  <div
    data-slot="attachment"
    data-state={state}
    data-size={size}
    data-orientation={orientation}
    className={cn(attachmentVariants({ orientation, size }), className)}
    {...props}
  />
)

const AttachmentMedia = ({
  className,
  variant = 'icon',
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof attachmentMediaVariants>) => (
  <div
    data-slot="attachment-media"
    data-variant={variant}
    className={cn(attachmentMediaVariants({ variant }), className)}
    {...props}
  />
)

const AttachmentContent = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => (
  <div
    data-slot="attachment-content"
    className={cn(
      `max-w-full min-w-0 flex-1 leading-tight group-data-[orientation=vertical]/attachment:px-1`,
      className
    )}
    {...props}
  />
)

const AttachmentTitle = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
  <span
    data-slot="attachment-title"
    className={cn(
      `group-data-[state=processing]/attachment:shimmer group-data-[state=uploading]/attachment:shimmer block max-w-full min-w-0 truncate font-medium`,
      className
    )}
    {...props}
  />
)

const AttachmentDescription = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
  <span
    data-slot="attachment-description"
    className={cn(
      `text-muted-foreground group-data-[state=error]/attachment:text-destructive/80 mt-0.5 block min-w-0 truncate text-xs`,
      'max-w-full',
      className
    )}
    {...props}
  />
)

const AttachmentActions = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => (
  <div
    data-slot="attachment-actions"
    className={cn(
      `relative z-20 flex shrink-0 items-center group-data-[orientation=vertical]/attachment:absolute group-data-[orientation=vertical]/attachment:top-3 group-data-[orientation=vertical]/attachment:right-3 group-data-[orientation=vertical]/attachment:gap-1`,
      className
    )}
    {...props}
  />
)

const AttachmentAction = ({
  className,
  variant,
  size = 'icon-xs',
  ...props
}: React.ComponentProps<typeof Button>) => (
  <Button
    data-slot="attachment-action"
    variant={variant ?? 'ghost'}
    size={size}
    className={cn(className)}
    {...props}
  />
)

const AttachmentTrigger = ({
  className,
  render,
  type,
  ...props
}: useRender.ComponentProps<'button'>) =>
  useRender({
    defaultTagName: 'button',
    props: mergeProps<'button'>(
      {
        className: cn('absolute inset-0 z-10 outline-none', className),
        type: render ? type : (type ?? 'button'),
      },
      props
    ),
    render,
    state: {
      slot: 'attachment-trigger',
    },
  })

const AttachmentGroup = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => (
  <div
    data-slot="attachment-group"
    className={cn(
      `scroll-fade-x flex min-w-0 snap-x snap-mandatory scroll-px-1 scrollbar-none gap-3 overflow-x-auto overscroll-x-contain py-1 *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start`,
      className
    )}
    {...props}
  />
)

export {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
}
