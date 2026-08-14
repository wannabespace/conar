import { cn } from '@tamery/ui/lib/utils'
import * as ResizablePrimitive from 'react-resizable-panels'

const ResizablePanelGroup = ({
  className,
  ...props
}: ResizablePrimitive.GroupProps) => (
  <ResizablePrimitive.Group
    data-slot="resizable-panel-group"
    className={cn(
      `flex size-full aria-[orientation=vertical]:flex-col`,
      className
    )}
    {...props}
  />
)

const ResizablePanel = ({ ...props }: ResizablePrimitive.PanelProps) => (
  <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
)

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: ResizablePrimitive.SeparatorProps & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.Separator
    data-slot="resizable-handle"
    className={cn(
      `bg-border ring-offset-background focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:outline-hidden aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-1 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2 [&[aria-orientation=horizontal]>div]:rotate-90`,
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="bg-border z-10 flex h-6 w-1 shrink-0 rounded-lg" />
    )}
  </ResizablePrimitive.Separator>
)

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
