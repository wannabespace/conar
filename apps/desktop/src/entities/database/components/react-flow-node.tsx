import type { Edge, Node, NodeProps } from '@xyflow/react'
import type { Column } from '../utils/table'
import { Button } from '@conar/ui/components/button'
import { cn } from '@conar/ui/lib/utils'
import { RiBookOpenLine, RiEraserLine, RiExternalLinkLine, RiFingerprintLine, RiKey2Line, RiLinksLine, RiTableLine } from '@remixicon/react'
import { Link } from '@tanstack/react-router'
import { Handle, Position } from '@xyflow/react'

export type NodeType = Node<{
  databaseId: string
  schema: string
  table: string
  columns: Column[]
  selected?: boolean
  edges: Edge[]
}, 'tableNode'>

export function ReactFlowNode({ data }: NodeProps<NodeType>) {
  return (
    <div
      className={cn(
        'rounded-xl bg-card shadow-[0_1px_1px_rgba(0,0,0,0.02),_0_2px_2px_rgba(0,0,0,0.02),_0_4px_4px_rgba(0,0,0,0.02),_0_8px_8px_rgba(0,0,0,0.02),_0_16px_16px_rgba(0,0,0,0.02),_0_32px_32px_rgba(0,0,0,0.02)] w-66 font-mono',
        data.selected ? 'ring-2 ring-primary ring-offset-2' : '',
      )}
    >
      <div className="flex gap-2 items-center justify-between px-4 py-3 border-b border-border/80 bg-gradient-to-t from-background/70 dark:from-background/30">
        <div data-mask className="flex items-center gap-2 text-sm min-w-0">
          <RiTableLine className="size-5 text-muted-foreground/80 shrink-0" />
          <span className="truncate block">{data.table}</span>
        </div>
        <Button
          size="icon-xs"
          variant="outline"
          asChild
        >
          <Link
            to="/database/$id/table"
            params={{ id: data.databaseId }}
            search={{ schema: data.schema, table: data.table }}
          >
            <RiExternalLinkLine className="size-3" />
          </Link>
        </Button>
      </div>
      <div className="text-xs py-2">
        {data.columns.map(column => (
          <div key={column.id} className="px-4 relative group">
            <div className="flex items-center justify-between gap-2 py-2 border-dashed group-not-last:border-b">
              <div className="flex items-center gap-1 truncate">
                {column.primaryKey && (
                  <RiKey2Line className="shrink-0 size-3 text-muted-foreground/70" />
                )}
                {column.isNullable && (
                  <RiEraserLine className="shrink-0 size-3 text-muted-foreground/70" />
                )}
                {column.unique && (
                  <RiFingerprintLine className="shrink-0 size-3 text-muted-foreground/70" />
                )}
                {column.isEditable === false && (
                  <RiBookOpenLine className="shrink-0 size-3 text-muted-foreground/70" />
                )}
                {column.foreign && (
                  <RiLinksLine className="shrink-0 size-3 text-muted-foreground/70" />
                )}
                <span data-mask className="truncate font-medium">{column.id}</span>
              </div>
              <span className="text-muted-foreground/60">{column.type}</span>
              {column.foreign && (
                <Handle
                  type="source"
                  position={Position.Right}
                  id={column.id}
                  className="size-2.5 rounded-full bg-foreground! border-2 border-background"
                  isConnectable={false}
                />
              )}
              {column.primaryKey && (
                <Handle
                  type="target"
                  position={Position.Left}
                  id={column.id}
                  className="size-2.5 rounded-full bg-foreground! border-2 border-background"
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
