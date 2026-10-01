import { cn } from '@tamery/ui/lib/utils'
import { Handle, Position } from '@xyflow/react'

import type { DiagramColumn } from '../lib/schema'

export const handleId = (
  column: string,
  side: 'left' | 'right',
  kind: 'source' | 'target'
) => `${column}:${side}:${kind}`

export const handleColumn = (id: string) => id.split(':').slice(0, -2).join(':')

const handleClass =
  'border-popover bg-foreground/50! size-2! rounded-full border-2! opacity-0 transition-opacity group-hover/node:opacity-100 data-[linked=true]:opacity-100'

// Every handle subscribes to the flow store, so a card mounts only the
// handles an edge can end on: keys and linked columns always (a drag may land
// on a key; an edge needs both its ends), other columns' source handles only
// while the pointer is over a connectable card.
export const RowHandles = ({
  column,
  connectable,
  hovered,
  linked,
}: {
  column: DiagramColumn
  connectable: boolean
  hovered: boolean
  linked: boolean
}) => (
  <>
    {(column.primaryKey || column.unique || linked) && (
      <>
        <Handle
          type="target"
          position={Position.Left}
          id={handleId(column.id, 'left', 'target')}
          isConnectable={connectable}
          data-linked={linked}
          className={cn(handleClass, '-left-1!')}
        />
        <Handle
          type="target"
          position={Position.Right}
          id={handleId(column.id, 'right', 'target')}
          isConnectable={connectable}
          data-linked={linked}
          className={cn(handleClass, '-right-1!')}
        />
      </>
    )}
    {(linked || (connectable && hovered)) && (
      <>
        <Handle
          type="source"
          position={Position.Right}
          id={handleId(column.id, 'right', 'source')}
          isConnectable={connectable}
          data-linked={linked}
          className={cn(handleClass, '-right-1!')}
        />
        <Handle
          type="source"
          position={Position.Left}
          id={handleId(column.id, 'left', 'source')}
          isConnectable={connectable}
          data-linked={linked}
          className={cn(handleClass, '-left-1!')}
        />
      </>
    )}
  </>
)
