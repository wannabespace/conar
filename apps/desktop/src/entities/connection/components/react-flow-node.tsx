import type { Edge, Node, NodeProps } from '@xyflow/react'
import type { Column } from './table/utils'
import { Button } from '@conar/ui/components/button'
import { cn } from '@conar/ui/lib/utils'
import { RiBookOpenLine, RiEraserLine, RiExternalLinkLine, RiFingerprintLine, RiKey2Line, RiLinksLine, RiTableLine } from '@remixicon/react'
import { Link } from '@tanstack/react-router'
import { Handle, Position } from '@xyflow/react'

export type NodeType = Node<{
  resourceId: string
  schema: string
  table: string
  columns: (Column & { searchMatched?: boolean })[]
  searchActive?: boolean
  tableSearchMatched?: boolean
  edges: Edge[]
}, 'tableNode'>

export function ReactFlowNode({ data }: NodeProps<NodeType>) {
  return (
    <div
      className={cn(
        `
          w-66 rounded-xl bg-card font-mono
          shadow-[0_1px_1px_rgba(0,0,0,0.02),0_2px_2px_rgba(0,0,0,0.02),0_4px_4px_rgba(0,0,0,0.02),0_8px_8px_rgba(0,0,0,0.02),0_16px_16px_rgba(0,0,0,0.02),0_32px_32px_rgba(0,0,0,0.02)]
          transition-opacity
        `,
        data.searchActive && data.tableSearchMatched && `
          ring-2 ring-primary/60 ring-offset-2
        `,
        data.searchActive && !data.tableSearchMatched && !data.columns.some(c => c.searchMatched) && `
          opacity-50
        `,
      )}
    >
      <div className="
        flex items-center justify-between gap-2 border-b border-border/80
        bg-linear-to-t from-background/70 px-4 py-3
        dark:from-background/30
      "
      >
        <div data-mask className="flex min-w-0 items-center gap-2 text-sm">
          <RiTableLine className="size-5 shrink-0 text-muted-foreground/80" />
          <span className={cn(`block truncate`, data.searchActive && data.tableSearchMatched && `
            text-primary
          `)}
          >
            {data.table}
          </span>
        </div>
        <Button
          size="icon-xs"
          variant="outline"
          asChild
        >
          <Link
            to="/connection/$resourceId/table"
            params={{ resourceId: data.resourceId }}
            search={{ schema: data.schema, table: data.table }}
          >
            <RiExternalLinkLine className="size-3" />
          </Link>
        </Button>
      </div>
      <div className="py-2 text-xs">
        {data.columns.map(column => (
          <div
            key={column.id}
            className={cn(
              'group relative px-4 transition-opacity',
              data.searchActive && column.searchMatched && `
                rounded-sm text-primary ring-2 ring-primary/60 ring-offset-2
              `,
              data.searchActive && data.columns.some(c => c.searchMatched) && !column.searchMatched && `
                opacity-50
              `,
            )}
          >
            <div className="
              flex items-center justify-between gap-2 border-dashed py-2
              group-not-last:border-b
            "
            >
              <div className="flex items-center gap-1 truncate">
                {column.primaryKey && (
                  <RiKey2Line className="
                    size-3 shrink-0 text-muted-foreground/70
                  "
                  />
                )}
                {column.isNullable && (
                  <RiEraserLine className="
                    size-3 shrink-0 text-muted-foreground/70
                  "
                  />
                )}
                {column.unique && (
                  <RiFingerprintLine className="
                    size-3 shrink-0 text-muted-foreground/70
                  "
                  />
                )}
                {column.isEditable === false && (
                  <RiBookOpenLine className="
                    size-3 shrink-0 text-muted-foreground/70
                  "
                  />
                )}
                {column.foreign && (
                  <RiLinksLine className="
                    size-3 shrink-0 text-muted-foreground/70
                  "
                  />
                )}
                <span data-mask className="truncate font-medium">{column.id}</span>
              </div>
              <span className="max-w-1/2 truncate text-muted-foreground/60">{column.type}</span>
              {column.foreign && (
                <Handle
                  type="source"
                  position={Position.Right}
                  id={column.id}
                  className="
                    size-2.5 rounded-full border-2 border-background
                    bg-foreground!
                  "
                  isConnectable={false}
                />
              )}
              {column.primaryKey && (
                <Handle
                  type="target"
                  position={Position.Left}
                  id={column.id}
                  className="
                    size-2.5 rounded-full border-2 border-background
                    bg-foreground!
                  "
                  isConnectable={false}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
