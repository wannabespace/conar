import type * as React from 'react'
import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar'
import { cn } from '@conar/ui/lib/utils'

export function Avatar({
  className,
  ...props
}: AvatarPrimitive.Root.Props): React.ReactElement {
  return (
    <AvatarPrimitive.Root
      className={cn(
        `
          inline-flex size-8 shrink-0 items-center justify-center
          overflow-hidden rounded-full bg-background align-middle text-xs
          font-medium select-none
        `,
        className,
      )}
      data-slot="avatar"
      {...props}
    />
  )
}

export function AvatarImage({
  className,
  ...props
}: AvatarPrimitive.Image.Props): React.ReactElement {
  return (
    <AvatarPrimitive.Image
      className={cn('size-full object-cover', className)}
      data-slot="avatar-image"
      {...props}
    />
  )
}

export function AvatarFallback({
  className,
  ...props
}: AvatarPrimitive.Fallback.Props): React.ReactElement {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        'flex size-full items-center justify-center rounded-full bg-muted',
        className,
      )}
      data-slot="avatar-fallback"
      {...props}
    />
  )
}

export { AvatarPrimitive }
