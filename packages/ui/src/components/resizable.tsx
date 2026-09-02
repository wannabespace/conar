import { cn } from '@tamery/ui/lib/utils'
import type { RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'
import * as ResizablePrimitive from 'react-resizable-panels'

const FOLD_TRANSITION = ['flex-grow', 'width', 'height']
  .map((property) => `${property} 250ms cubic-bezier(0.32, 0.72, 0, 1)`)
  .join(', ')

const setFoldTransition = (panel: HTMLElement, transition: string) => {
  for (const sibling of panel.parentElement?.children ?? []) {
    if (sibling instanceof HTMLElement) {
      sibling.style.transition = transition
    }
  }
}

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

const ResizablePanel = ({
  collapsed,
  defaultSize,
  onResize,
  panelRef: panelRefProp,
  style,
  ...props
}: Omit<ResizablePrimitive.PanelProps, 'elementRef'> & {
  collapsed?: boolean
  panelRef?: RefObject<ResizablePrimitive.PanelImperativeHandle | null>
}) => {
  const ownPanelRef = ResizablePrimitive.usePanelRef()
  const panelRef = panelRefProp ?? ownPanelRef
  const elementRef = useRef<HTMLDivElement>(null)
  const [folding, setFolding] = useState(false)
  // oxlint-disable-next-line react/hook-use-state
  const [initialSize] = useState(() => (collapsed ? 0 : defaultSize))

  useEffect(() => {
    const panel = panelRef.current
    const element = elementRef.current

    if (
      collapsed === undefined ||
      !(panel && element) ||
      panel.isCollapsed() === collapsed
    ) {
      return
    }

    setFoldTransition(element, FOLD_TRANSITION)
    setFolding(true)

    if (collapsed) {
      panel.collapse()
    } else if (defaultSize === undefined) {
      panel.expand()
    } else {
      panel.resize(defaultSize)
    }
  }, [collapsed, defaultSize, panelRef])

  return (
    <ResizablePrimitive.Panel
      data-slot="resizable-panel"
      collapsible={collapsed !== undefined}
      defaultSize={initialSize}
      elementRef={elementRef}
      panelRef={panelRef}
      style={collapsed && !folding ? { ...style, overflow: 'hidden' } : style}
      onResize={folding ? undefined : onResize}
      onTransitionEnd={(event) => {
        if (
          event.target === event.currentTarget &&
          event.propertyName === 'flex-grow'
        ) {
          setFoldTransition(event.currentTarget, '')
          setFolding(false)
        }
      }}
      {...props}
    />
  )
}

const ResizableHandle = ({
  className,
  ...props
}: ResizablePrimitive.SeparatorProps) => (
  <ResizablePrimitive.Separator
    data-slot="resizable-handle"
    className={cn(
      `group/resizable-handle relative z-10 flex w-1.5 items-center justify-center bg-transparent outline-hidden aria-[orientation=horizontal]:h-1.5 aria-[orientation=horizontal]:w-full`,
      className
    )}
    {...props}
  >
    <div className="group-data-[separator=active]/resizable-handle:bg-primary/40 group-data-[separator=focus]/resizable-handle:bg-border group-data-[separator=hover]/resizable-handle:bg-border h-full w-[2px] rounded-xs transition-colors group-aria-[orientation=horizontal]/resizable-handle:h-[2px] group-aria-[orientation=horizontal]/resizable-handle:w-full" />
  </ResizablePrimitive.Separator>
)

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
