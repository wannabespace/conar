import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'

import { dialogContentVariants, dialogTitleVariants } from './dialog.utils'

type DialogVariant = 'default' | 'panel'

const DialogVariantContext = React.createContext<DialogVariant>('default')

const Dialog = ({
  variant = 'default',
  ...props
}: DialogPrimitive.Root.Props & { variant?: DialogVariant }) => (
  <DialogVariantContext.Provider value={variant}>
    <DialogPrimitive.Root data-slot="dialog" {...props} />
  </DialogVariantContext.Provider>
)

const DialogTrigger = ({ ...props }: DialogPrimitive.Trigger.Props) => (
  <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
)

const DialogPortal = ({ ...props }: DialogPrimitive.Portal.Props) => (
  <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
)

const DialogClose = ({ ...props }: DialogPrimitive.Close.Props) => (
  <DialogPrimitive.Close data-slot="dialog-close" {...props} />
)

const DialogOverlay = ({
  className,
  animated = true,
  ...props
}: DialogPrimitive.Backdrop.Props & { animated?: boolean }) => (
  <DialogPrimitive.Backdrop
    data-slot="dialog-overlay"
    className={cn(
      `fixed inset-0 isolate z-50 bg-black/30 duration-100 supports-backdrop-filter:backdrop-blur-sm`,
      animated &&
        `data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0`,
      className
    )}
    {...props}
  />
)

const DialogCloseButton = ({
  className,
  ...props
}: DialogPrimitive.Close.Props) => (
  <DialogPrimitive.Close
    data-slot="dialog-close"
    render={
      <Button
        className={cn('bg-secondary', className)}
        size="icon-sm"
        variant="ghost"
      />
    }
    {...props}
  >
    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
    <span className="sr-only">Close</span>
  </DialogPrimitive.Close>
)

const DialogContent = ({
  className,
  children,
  showCloseButton = true,
  animated = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  animated?: boolean
}) => (
  <DialogPortal>
    <DialogOverlay animated={animated} />
    <DialogPrimitive.Popup
      data-slot="dialog-content"
      className={cn(
        dialogContentVariants({ variant: React.use(DialogVariantContext) }),
        animated &&
          `data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95`,
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogCloseButton className="absolute top-4 right-4" />
      )}
    </DialogPrimitive.Popup>
  </DialogPortal>
)

const DialogHeader = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="dialog-header"
    className={cn('flex flex-col gap-1.5', className)}
    {...props}
  />
)

const DialogFooter = ({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  showCloseButton?: boolean
}) => (
  <div
    data-slot="dialog-footer"
    className={cn(
      `flex flex-col-reverse gap-2 sm:flex-row sm:justify-end`,
      className
    )}
    {...props}
  >
    {children}
    {showCloseButton && (
      <DialogPrimitive.Close render={<Button variant="outline" />}>
        Close
      </DialogPrimitive.Close>
    )}
  </div>
)

const DialogTitle = ({ className, ...props }: DialogPrimitive.Title.Props) => (
  <DialogPrimitive.Title
    data-slot="dialog-title"
    className={cn(
      dialogTitleVariants({ variant: React.use(DialogVariantContext) }),
      className
    )}
    {...props}
  />
)

const DialogDescription = ({
  className,
  ...props
}: DialogPrimitive.Description.Props) => (
  <DialogPrimitive.Description
    data-slot="dialog-description"
    className={cn(
      `text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3`,
      className
    )}
    {...props}
  />
)

export {
  Dialog,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
