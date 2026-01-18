import { Button } from '@conar/ui/components/button'
import { HighlightText } from '@conar/ui/components/custom/hightlight'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { copy as copyToClipboard } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiDeleteBin7Line, RiEditLine, RiFileCopyLine, RiFolderLine, RiMoreLine, RiTableLine } from '@remixicon/react'
import { Link } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { AnimatePresence, motion } from 'motion/react'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { addTab, addTableToFolder, clearTableSelection, databaseStore, removeTableFromFolder, toggleFolder } from '~/entities/database/store'
import { Route } from '..'

const treeVariants = {
  visible: { opacity: 1, height: 'auto' },
  hidden: { opacity: 0, height: 0 },
}

const treeTransition = {
  layout: { duration: 0.15, ease: 'easeInOut' as const },
  opacity: { duration: 0.1 },
  height: { duration: 0.1 },
}

interface TableInFolderItemProps {
  schema: string
  table: string
  search?: string
  onRemove: () => void
  onRename: () => void
  onDrop: () => void
}

function TableInFolderItem({ schema, table, search, onRemove, onRename, onDrop }: TableInFolderItemProps) {
  const { database } = Route.useRouteContext()

  const handleDragStart = (e: React.DragEvent) => {
    const dragData = {
      type: 'table',
      schema,
      tables: [table],
    }

    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="group/table-in-folder relative">
      <Link
        to="/database/$id/table"
        params={{ id: database.id }}
        search={{
          schema,
          table,
        }}
        preloadDelay={200}
        onDoubleClick={() => addTab(database.id, schema, table)}
        draggable={true}
        onDragStart={handleDragStart}
        className={cn(
          `
            flex w-full items-center gap-2 rounded-md border border-transparent
            px-2 py-1 text-sm text-foreground
            hover:bg-accent/30
          `,
        )}
      >
        <RiTableLine
          className="size-4 shrink-0 text-muted-foreground opacity-50"
        />
        <span className="truncate">
          <HighlightText text={table} match={search} />
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className={`
                ml-auto opacity-0 transition-opacity
                group-hover/table-in-folder:opacity-100
                focus-visible:opacity-100
              `}
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
                onRemove()
              }}
            >
              <RiFolderLine className="size-4" />
              Remove from Folder
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onRename()
              }}
            >
              <RiEditLine className="size-4" />
              Rename Table
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDrop()
              }}
            >
              <RiDeleteBin7Line className="size-4" />
              Drop Table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Link>
    </div>
  )
}

export function FolderItem({ schema, folder, tables, search, onRename, onDelete, onRemoveTable, onRenameTable, onDropTable }: {
  schema: string
  folder: string
  tables: string[]
  search?: string
  onRename: () => void
  onDelete: () => void
  onRemoveTable: (table: string) => void
  onRenameTable: (table: string) => void
  onDropTable: (table: string) => void
}) {
  const { database } = Route.useRouteContext()
  const store = databaseStore(database.id)
  const openedFolders = useStore(store, state => state.tablesTreeOpenedFolders)
  const selectedTables = useStore(store, state => state.selectedTables)
  const isOpen = openedFolders.some(f => f.schema === schema && f.folder === folder)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))

      if (data.type === 'table' && data.schema === schema) {
        const tablesToMove = data.tables as string[]

        const tableFolders = store.state.tableFolders.filter(f => f.schema === schema)
        const currentFolder = tableFolders.find(f => f.folder === folder)

        const allAlreadyInFolder = tablesToMove.every(table =>
          currentFolder?.tables.includes(table),
        )

        if (allAlreadyInFolder) {
          return
        }

        let moved = false

        tablesToMove.forEach((table) => {
          tableFolders.forEach((existingFolder) => {
            if (existingFolder.tables.includes(table) && existingFolder.folder !== folder) {
              removeTableFromFolder(database.id, schema, existingFolder.folder, table)
              moved = true
            }
          })
        })

        tablesToMove.forEach((table) => {
          if (!currentFolder?.tables.includes(table)) {
            addTableToFolder(database.id, schema, folder, table)
            moved = true
          }
        })

        if (moved) {
          if (selectedTables.length > 0) {
            clearTableSelection(database.id)
          }

          toast.success(
            tablesToMove.length === 1
              ? `Table "${tablesToMove[0]}" moved to folder "${folder}"`
              : `${tablesToMove.length} tables moved to folder "${folder}"`,
          )
        }
      }
    }
    catch (error) {
      console.error('Failed to parse drop data:', error)
    }
  }

  return (
    <motion.div
      variants={treeVariants}
      initial={search ? treeVariants.hidden : false}
      animate="visible"
      exit="hidden"
      transition={treeTransition}
      className="space-y-0.5"
    >
      <div
        className={cn(
          `
            group flex w-full cursor-pointer items-center gap-2 rounded-md
            border border-transparent px-2 py-1 text-sm text-foreground
            transition-colors
            hover:bg-accent/30
          `,
          isDragOver && 'border-primary bg-primary/10',
        )}
        onClick={() => toggleFolder(database.id, schema, folder)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <RiFolderLine
          className="size-4 shrink-0 text-muted-foreground opacity-50"
        />
        <span className="truncate">
          <HighlightText text={folder} match={search} />
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {tables.length}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className={`
                opacity-0 transition-opacity
                group-hover:opacity-100
                focus-visible:opacity-100
              `}
              onClick={e => e.stopPropagation()}
            >
              <RiMoreLine className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onRename()
              }}
            >
              <RiEditLine className="size-4" />
              Rename Folder
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <RiDeleteBin7Line className="size-4" />
              Delete Folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden pl-4"
          >
            <div className="space-y-0.5">
              {tables.map(table => (
                <TableInFolderItem
                  key={table}
                  schema={schema}
                  table={table}
                  search={search}
                  onRemove={() => onRemoveTable(table)}
                  onRename={() => onRenameTable(table)}
                  onDrop={() => onDropTable(table)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
