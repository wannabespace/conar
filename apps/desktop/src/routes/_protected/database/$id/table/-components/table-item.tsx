import { Button } from '@conar/ui/components/button'
import { HighlightText } from '@conar/ui/components/custom/hightlight'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { copy as copyToClipboard } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiDeleteBin7Line, RiEditLine, RiFileCopyLine, RiFolderLine, RiMoreLine, RiPushpinFill, RiPushpinLine, RiTableLine } from '@remixicon/react'
import { Link } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import React from 'react'
import { addTab, databaseStore, togglePinTable, toggleTableSelection } from '~/entities/database/store'
import { Route } from '..'

export function TableItem({ schema, table, pinned = false, search, onRename, onDrop, onAddToFolder }: {
  schema: string
  table: string
  pinned?: boolean
  search?: string
  onRename: () => void
  onDrop: () => void
  onAddToFolder: () => void
}) {
  const { table: tableParam, schema: schemaParam } = Route.useSearch()
  const { database } = Route.useRouteContext()
  const store = databaseStore(database.id)
  const selectedTables = useStore(store, state => state.selectedTables)
  const isSelected = selectedTables.some(t => t.schema === schema && t.table === table)

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      toggleTableSelection(database.id, schema, table)
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    const tablesToDrag = isSelected && selectedTables.length > 0
      ? selectedTables.filter(t => t.schema === schema).map(t => t.table)
      : [table]

    const dragData = {
      type: 'table',
      schema,
      tables: tablesToDrag,
    }

    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="relative">
      <Link
        to="/database/$id/table"
        params={{ id: database.id }}
        search={{
          schema,
          table,
        }}
        preloadDelay={200}
        onClick={handleClick}
        onDoubleClick={() => addTab(database.id, schema, table)}
        draggable={true}
        onDragStart={handleDragStart}
        className={cn(
          `
            group flex w-full items-center gap-2 rounded-md border
            border-transparent px-2 py-1 text-sm text-foreground
            hover:bg-accent/30
          `,
          tableParam === table && schemaParam === schema && `
            border-primary/20 bg-primary/10
            hover:bg-primary/20
          `,
          isSelected && `border-accent-foreground/20 bg-accent`,
        )}
      >
        <RiTableLine
          className={cn(
            'size-4 shrink-0 text-muted-foreground opacity-50',
            tableParam === table && 'text-primary opacity-100',
          )}
        />
        <span className="truncate">
          <HighlightText text={table} match={search} />
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          className={cn(
            `
              -mr-1 ml-auto opacity-0 transition-opacity
              group-hover:opacity-100
              focus-visible:opacity-100
            `,
            tableParam === table && 'hover:bg-primary/10',
          )}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            togglePinTable(database.id, schema, table)
          }}
        >
          {pinned
            ? <RiPushpinFill className="size-3 text-primary" />
            : (
                <RiPushpinLine className="size-3" />
              )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className={cn(
                `
                  opacity-0 transition-opacity
                  group-hover:opacity-100
                  focus-visible:opacity-100
                `,
                tableParam === table && 'hover:bg-primary/10',
              )}
              onClick={e => e.stopPropagation()}
            >
              <RiMoreLine className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                copyToClipboard(table, 'Table name copied')
              }}
            >
              <RiFileCopyLine className="size-4" />
              Copy Name
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onAddToFolder()
              }}
            >
              <RiFolderLine className="size-4" />
              Add to Folder
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onRename()
              }}
            >
              <RiEditLine className="size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDrop()
              }}
            >
              <RiDeleteBin7Line className="size-4" />
              Drop
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Link>
    </div>
  )
}
