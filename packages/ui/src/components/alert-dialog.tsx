import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog'
import { Button } from '@tamery/ui/components/button'
import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'

const AlertDialog = ({ ...props }: AlertDialogPrimitive.Root.Props) => (
  <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
)

const AlertDialogTrigger = ({
  ...props
}: AlertDialogPrimitive.Trigger.Props) => (
  <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
)

const AlertDialogPortal = ({ ...props }: AlertDialogPrimitive.Portal.Props) => (
  <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
)

const AlertDialogOverlay = ({
  className,
  ...props
}: AlertDialogPrimitive.Backdrop.Props) => (
  <AlertDialogPrimitive.Backdrop
    data-slot="alert-dialog-overlay"
    className={cn(
      `data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 isolate z-50 bg-black/30 duration-100 supports-backdrop-filter:backdrop-blur-sm`,
      className
    )}
    {...props}
  />
)

const AlertDialogContent = ({
  className,
  size = 'default',
  ...props
}: AlertDialogPrimitive.Popup.Props & {
  size?: 'default' | 'sm'
}) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Popup
      data-slot="alert-dialog-content"
      data-size={size}
      className={cn(
        `group/alert-dialog-content bg-card text-foreground ring-foreground/4 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 fixed top-1/2 left-1/2 z-50 grid w-full -translate-1/2 gap-6 rounded-[min(var(--radius-4xl),24px)] p-6 shadow-xl ring-[0.5px] duration-100 outline-none data-[size=default]:max-w-xs data-[size=sm]:max-w-xs sm:data-[size=default]:max-w-md`,
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
)

const AlertDialogHeader = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => (
  <div
    data-slot="alert-dialog-header"
    className={cn(
      `grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-6 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]`,
      className
    )}
    {...props}
  />
)

const AlertDialogFooter = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => (
  <div
    data-slot="alert-dialog-footer"
    className={cn(
      `flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end`,
      className
    )}
    {...props}
  />
)

const AlertDialogMedia = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => (
  <div
    data-slot="alert-dialog-media"
    className={cn(
      `bg-muted mb-2 inline-flex size-16 items-center justify-center rounded-full sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-8`,
      className
    )}
    {...props}
  />
)

const AlertDialogTitle = ({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) => (
  <AlertDialogPrimitive.Title
    data-slot="alert-dialog-title"
    className={cn(
      `font-heading text-lg font-medium sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2`,
      className
    )}
    {...props}
  />
)

const AlertDialogDescription = ({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) => (
  <AlertDialogPrimitive.Description
    data-slot="alert-dialog-description"
    className={cn(
      `text-muted-foreground *:[a]:hover:text-foreground text-sm text-balance md:text-pretty *:[a]:underline *:[a]:underline-offset-3`,
      className
    )}
    {...props}
  />
)

const AlertDialogAction = ({
  className,
  ...props
}: React.ComponentProps<typeof Button>) => (
  <Button
    data-slot="alert-dialog-action"
    className={cn(className)}
    {...props}
  />
)

const AlertDialogCancel = ({
  className,
  variant = 'outline',
  size = 'default',
  ...props
}: AlertDialogPrimitive.Close.Props &
  Pick<React.ComponentProps<typeof Button>, 'variant' | 'size'>) => (
  <AlertDialogPrimitive.Close
    data-slot="alert-dialog-cancel"
    className={cn(className)}
    render={<Button variant={variant} size={size} />}
    {...props}
  />
)

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
