import {
  BookOpen01Icon,
  EraserIcon,
  FingerPrintIcon,
  Key01Icon,
  LayoutTable02Icon,
  Link01Icon,
  LinkSquare02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import type { Edge, Node, NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'

import { Link } from '~/components/link'
import { tableTabId } from '~/entities/connection/store'

import type { Column } from './table/cell'

export type NodeType = Node<
  {
    resourceId: string
    schema: string
    table: string
    columns: (Column & { searchMatched?: boolean })[]
    searchActive?: boolean
    tableSearchMatched?: boolean
    edges: Edge[]
  },
  'tableNode'
>

export const ReactFlowNode = ({ data }: NodeProps<NodeType>) => (
  <div
    className={cn(
      `bg-card w-66 rounded-xl font-mono shadow-[0_0.0625rem_0.0625rem_rgba(0,0,0,0.02),0_0.125rem_0.125rem_rgba(0,0,0,0.02),0_0.25rem_0.25rem_rgba(0,0,0,0.02),0_0.5rem_0.5rem_rgba(0,0,0,0.02),0_1rem_1rem_rgba(0,0,0,0.02),0_2rem_2rem_rgba(0,0,0,0.02)] transition-opacity`,
      data.searchActive && data.tableSearchMatched && `ring-primary/60 ring-1`,
      data.searchActive &&
        !data.tableSearchMatched &&
        !data.columns.some((c) => c.searchMatched) &&
        `opacity-50`
    )}
  >
    <div className="border-border/80 from-background/50 flex items-center justify-between gap-2 border-b bg-linear-to-t px-4 py-3">
      <div data-mask className="flex min-w-0 items-center gap-2 text-sm">
        <HugeiconsIcon
          icon={LayoutTable02Icon}
          strokeWidth={2}
          className="text-muted-foreground/80 size-5 shrink-0"
        />
        <span
          className={cn(
            `block truncate`,
            data.searchActive && data.tableSearchMatched && `text-primary`
          )}
        >
          {data.table}
        </span>
      </div>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon-xs"
              variant="outline"
              aria-label="Open table"
              nativeButton={false}
              render={
                <Link
                  to="/connection/$resourceId/$tabId"
                  params={{
                    resourceId: data.resourceId,
                    tabId: tableTabId(data.schema, data.table),
                  }}
                />
              }
            />
          }
        >
          <HugeiconsIcon
            icon={LinkSquare02Icon}
            strokeWidth={2}
            className="size-3"
          />
        </TooltipTrigger>
        <TooltipContent side="top">Open table</TooltipContent>
      </Tooltip>
    </div>
    <div className="py-2 text-xs">
      {data.columns.map((column) => (
        <div
          key={column.id}
          className={cn(
            'group relative px-4 transition-opacity',
            data.searchActive &&
              column.searchMatched &&
              `text-primary ring-primary/60 rounded-sm ring-1`,
            data.searchActive &&
              data.columns.some((c) => c.searchMatched) &&
              !column.searchMatched &&
              `opacity-50`
          )}
        >
          <div className="flex items-center justify-between gap-2 border-dashed py-2 group-not-last:border-b">
            <div className="flex items-center gap-1 truncate">
              {column.primaryKey && (
                <HugeiconsIcon
                  icon={Key01Icon}
                  strokeWidth={2}
                  className="text-muted-foreground/70 size-3 shrink-0"
                />
              )}
              {column.isNullable && (
                <HugeiconsIcon
                  icon={EraserIcon}
                  strokeWidth={2}
                  className="text-muted-foreground/70 size-3 shrink-0"
                />
              )}
              {column.unique && (
                <HugeiconsIcon
                  icon={FingerPrintIcon}
                  strokeWidth={2}
                  className="text-muted-foreground/70 size-3 shrink-0"
                />
              )}
              {column.isEditable === false && (
                <HugeiconsIcon
                  icon={BookOpen01Icon}
                  strokeWidth={2}
                  className="text-muted-foreground/70 size-3 shrink-0"
                />
              )}
              {column.foreign && (
                <HugeiconsIcon
                  icon={Link01Icon}
                  strokeWidth={2}
                  className="text-muted-foreground/70 size-3 shrink-0"
                />
              )}
              <span data-mask className="truncate font-medium">
                {column.id}
              </span>
            </div>
            {(column.typeLabel || column.type) && (
              <span className="text-muted-foreground/60 max-w-1/2 truncate">
                {column.typeLabel || column.type}
              </span>
            )}
            {column.foreign && (
              <Handle
                type="source"
                position={Position.Right}
                id={column.id}
                className="border-background bg-foreground! size-2.5 rounded-full border-2"
                isConnectable={false}
              />
            )}
            {column.primaryKey && (
              <Handle
                type="target"
                position={Position.Left}
                id={column.id}
                className="border-background bg-foreground! size-2.5 rounded-full border-2"
                isConnectable={false}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)
