import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { RiCloseLine } from '@remixicon/react'
import { Button } from '@tamery/ui/components/button'
import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'

const Dialog = ({ ...props }: DialogPrimitive.Root.Props) => (
  <DialogPrimitive.Root data-slot="dialog" {...props} />
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
        `bg-card text-foreground ring-foreground/4 fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-1/2 gap-6 rounded-[min(var(--radius-4xl),24px)] p-6 text-sm shadow-xl ring-1 duration-100 outline-none sm:max-w-md`,
        animated &&
          `data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95`,
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close
          data-slot="dialog-close"
          render={
            <Button
              variant="ghost"
              className="bg-secondary absolute top-4 right-4"
              size="icon-sm"
            />
          }
        >
          <RiCloseLine />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
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
    className={cn('font-heading text-base leading-none font-medium', className)}
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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
