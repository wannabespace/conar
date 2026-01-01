import type * as React from 'react'
import { cn } from '@conar/ui/lib/utils'
import { GripVerticalIcon } from 'lucide-react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

function ResizablePanelGroup({
  className,
  direction = 'horizontal',
  autoSaveId,
  ...props
}: Omit<React.ComponentProps<typeof PanelGroup>, 'direction'> & {
  direction?: 'horizontal' | 'vertical'
  autoSaveId?: string
}) {
  return (
    <PanelGroup
      data-slot="resizable-panel-group"
      data-orientation={direction}
      direction={direction}
      autoSaveId={autoSaveId}
      className={cn(
        `
          flex size-full
          data-[orientation=vertical]:flex-col
        `,
        className,
      )}
      {...props}
    />
  )
}

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof Panel>) {
  return <Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof PanelResizeHandle> & {
  withHandle?: boolean
}) {
  return (
    <PanelResizeHandle
      data-slot="resizable-handle"
      className={cn(
        `
          relative flex w-px cursor-col-resize items-center justify-center
          bg-border
          after:absolute after:inset-y-0 after:left-1/2 after:w-1
          after:-translate-x-1/2
          focus-visible:ring-1 focus-visible:ring-ring
          focus-visible:ring-offset-1 focus-visible:outline-hidden
        `,
        `
          [[data-orientation=vertical]>&]:h-px
          [[data-orientation=vertical]>&]:w-full
          [[data-orientation=vertical]>&]:cursor-row-resize
          [[data-orientation=vertical]>&]:after:left-0
          [[data-orientation=vertical]>&]:after:h-1
          [[data-orientation=vertical]>&]:after:w-full
          [[data-orientation=vertical]>&]:after:translate-x-0
          [[data-orientation=vertical]>&]:after:-translate-y-1/2
        `,
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className={`
          z-10 flex h-4 w-3 items-center justify-center rounded-xs border
          bg-border
          in-data-[orientation=vertical]:rotate-90
        `}
        >
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </PanelResizeHandle>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
