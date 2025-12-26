import type * as React from 'react'
import { cn } from '@conar/ui/lib/utils'
import { GripVerticalIcon } from 'lucide-react'
import * as ResizablePrimitive from 'react-resizable-panels'

function ResizablePanelGroupWithAutoSave({
  className,
  direction,
  autoSaveId,
  ...props
}: Omit<React.ComponentProps<typeof ResizablePrimitive.Group>, 'orientation'> & {
  direction?: 'horizontal' | 'vertical'
  autoSaveId: string
}) {
  const layoutProps = ResizablePrimitive.useDefaultLayout({
    id: autoSaveId,
    storage: localStorage,
  })

  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      data-orientation={direction}
      orientation={direction}
      className={cn(
        `
          flex size-full
          data-[orientation=vertical]:flex-col
        `,
        className,
      )}
      {...layoutProps}
      {...props}
    />
  )
}

function ResizablePanelGroup({
  className,
  direction,
  autoSaveId,
  ...props
}: Omit<React.ComponentProps<typeof ResizablePrimitive.Group>, 'orientation'> & {
  direction?: 'horizontal' | 'vertical'
  autoSaveId?: string
}) {
  if (autoSaveId) {
    return (
      <ResizablePanelGroupWithAutoSave
        className={className}
        direction={direction}
        autoSaveId={autoSaveId}
        {...props}
      />
    )
  }

  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      data-orientation={direction}
      orientation={direction}
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
  defaultSize,
  minSize,
  maxSize,
  collapsedSize,
  ...props
}: Omit<React.ComponentProps<typeof ResizablePrimitive.Panel>, 'defaultSize' | 'minSize' | 'maxSize' | 'collapsedSize'> & {
  defaultSize?: number | string
  minSize?: number | string
  maxSize?: number | string
  collapsedSize?: number | string
}) {
  // In v4, numeric values are interpreted as pixels, so we add '%' for percentages
  const toPercentage = (value: number | string | undefined) =>
    typeof value === 'number' ? `${value}%` : value

  return (
    <ResizablePrimitive.Panel
      data-slot="resizable-panel"
      defaultSize={toPercentage(defaultSize)}
      minSize={toPercentage(minSize)}
      maxSize={toPercentage(maxSize)}
      collapsedSize={toPercentage(collapsedSize)}
      {...props}
    />
  )
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean
}) {
  return (
    <ResizablePrimitive.Separator
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
    </ResizablePrimitive.Separator>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
