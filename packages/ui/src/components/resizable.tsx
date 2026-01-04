import { RiDraggable } from '@remixicon/react'
import * as ResizablePrimitive from 'react-resizable-panels'
import { cn } from '../lib/utils'

function ResizablePanelGroup({
  className,
  ...props
}: ResizablePrimitive.GroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn(
        'size-full',
        className,
      )}
      {...props}
    />
  )
}

function ResizablePanel({
  ...props
}: ResizablePrimitive.PanelProps) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
}

function ResizableSeparator({
  withHandle,
  className,
  ...props
}: ResizablePrimitive.SeparatorProps & {
  withHandle?: boolean
}) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-separator"
      className={cn(
        `
          group relative min-h-1 min-w-1 shrink-0 rounded-sm delay-75
          duration-75
          focus-visible:bg-primary/40
          data-[separator='active']:bg-primary/30
          data-[separator='hover']:bg-primary/50
          data-[separator='hover']:aria-[orientation='horizontal']:cursor-row-resize
          data-[separator='hover']:aria-[orientation='vertical']:cursor-col-resize
        `,
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className={`
          pointer-events-none absolute top-1/2 left-1/2 -translate-1/2
          rounded-xs bg-border delay-75 duration-75
          group-aria-[orientation='horizontal']:px-0.5
          group-aria-[orientation='horizontal']:py-px
          group-aria-[orientation='vertical']:px-0.5
          group-aria-[orientation='vertical']:py-px
          group-data-[separator='active']:bg-primary
          group-data-[separator='hover']:bg-primary
        `}
        >
          <RiDraggable className={`
            size-2.5
            group-aria-[orientation='horizontal']:rotate-90
          `}
          />
        </div>
      )}
    </ResizablePrimitive.Separator>
  )
}

export { ResizablePanel, ResizablePanelGroup, ResizableSeparator }
