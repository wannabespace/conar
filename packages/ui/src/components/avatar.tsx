import { cn } from '@connnect/ui/lib/utils'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import * as React from 'react'

function Avatar({ ref, className, ...props }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & { ref?: React.RefObject<React.ComponentRef<typeof AvatarPrimitive.Root>> }) {
  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex size-10 shrink-0 overflow-hidden rounded-md',
        className,
      )}
      {...props}
    />
  )
}
Avatar.displayName = AvatarPrimitive.Root.displayName

function AvatarImage({ ref, className, ...props }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & { ref?: React.RefObject<React.ComponentRef<typeof AvatarPrimitive.Image>> }) {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  )
}
AvatarImage.displayName = AvatarPrimitive.Image.displayName

function AvatarFallback({ ref, className, ...props }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & { ref?: React.RefObject<React.ComponentRef<typeof AvatarPrimitive.Fallback>> }) {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted',
        className,
      )}
      {...props}
    />
  )
}
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarFallback, AvatarImage }
