import type { Edge, Node, NodeProps } from '@xyflow/react'
import type { Column } from './table/utils'
import { Button } from '@conar/ui/components/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiBookOpenLine, RiEraserLine, RiExternalLinkLine, RiFingerprintLine, RiKey2Line, RiLinksLine, RiListUnordered, RiTableLine } from '@remixicon/react'
import { Link } from '@tanstack/react-router'
import { Handle, Position } from '@xyflow/react'
import { ENUM_ANCHOR_ID } from '~/routes/_protected/database/$id/visualizer/-lib'

export type NodeType = Node<{
  databaseId: string
  schema: string
  table: string
  columns: (Column & { searchMatched?: boolean })[]
  searchActive?: boolean
  nodeSearchMatched?: boolean
  edges: Edge[]
  isEnum?: boolean
  referencedTables?: string[]
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
        data.searchActive && data.nodeSearchMatched && `
          ring-2 ring-primary/60 ring-offset-2
        `,
        data.searchActive && !data.nodeSearchMatched && !data.columns.some(c => c.searchMatched) && `
          opacity-50
        `,
      )}
    >
      <div className="
        flex items-center justify-between gap-2 border-b border-border/80
        bg-linear-to-t from-background/70 px-4 py-3
        dark:from-background/30
        relative
      "
      >

        <Handle
          type="target"
          position={Position.Left}
          id={ENUM_ANCHOR_ID}
          className="
          size-2.5 rounded-full border-2 border-background
          bg-foreground!
        "
          isConnectable={false}
        />

        <div data-mask className="flex min-w-0 items-center gap-2 text-sm">
          {data.isEnum
            ? (
                <RiListUnordered className="size-5 shrink-0 text-muted-foreground/80 self-start mt-0.5" />
              )
            : (
                <RiTableLine className="size-5 shrink-0 text-muted-foreground/80" />
              )}
          {data.isEnum && (
            <span className="absolute right-2 block truncate text-xs text-muted-foreground/80">enum</span>
          )}

          <div className="flex flex-col min-w-0">
            <span className={cn(
              'block truncate font-medium leading-tight',
              data.searchActive && data.nodeSearchMatched && 'text-primary',
            )}
            >
              {data.table}
            </span>
            {data.isEnum && data.referencedTables && data.referencedTables.length > 0 && (
              <div className="mt-0.5 flex items-center gap-1">
                <span className="
                    block w-fit max-w-[120px] truncate rounded-[4px] border border-border/50
                    bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground
                    leading-none
                 "
                >
                  {data.referencedTables[0]}
                </span>
                {data.referencedTables.length > 1 && (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <span className="
                              flex items-center justify-center
                              cursor-help rounded-[4px] border border-border/50
                              bg-muted/50 px-1 py-0.5 text-[10px] text-muted-foreground
                              leading-none hover:bg-muted font-medium
                           "
                        >
                          +
                          {data.referencedTables.length - 1}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="start" className="max-w-[200px] p-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-semibold text-muted-foreground mb-0.5">Referenced in:</span>
                          {data.referencedTables.map(t => (
                            <span key={t} className="text-xs">{t}</span>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
          </div>
        </div>

        {!data.isEnum && (
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
        )}
      </div>
      <div className="py-2 text-xs">
        {data.columns.filter(column => column.id !== ENUM_ANCHOR_ID).map(column => (
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
                {column.foreign && !column.enum && (
                  <RiLinksLine className="
                    size-3 shrink-0 text-muted-foreground/70
                  "
                  />
                )}

                {column.enum && (
                  <RiListUnordered className="
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
