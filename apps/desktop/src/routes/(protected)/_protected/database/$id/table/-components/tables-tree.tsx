import type { ComponentRef } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@conar/ui/components/accordion'
import { Button } from '@conar/ui/components/button'
import { HighlightText } from '@conar/ui/components/custom/hightlight'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { Separator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { copy as copyToClipboard } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiDeleteBin7Line, RiEditLine, RiFileCopyLine, RiFolderLine, RiMoreLine, RiPushpinFill, RiPushpinLine, RiStackLine, RiTableLine } from '@remixicon/react'
import { Link, useSearch } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { AnimatePresence, motion } from 'motion/react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useDatabaseTablesAndSchemas } from '~/entities/database/queries'
import { addTab, addTableToFolder, cleanupPinnedTables, clearTableSelection, databaseStore, removeTableFromFolder, toggleFolder, togglePinTable, toggleTableSelection } from '~/entities/database/store'
import { Route } from '..'
import { AddToFolderDialog } from './add-to-folder-dialog'
import { DeleteFolderDialog } from './delete-folder-dialog'
import { DropTableDialog } from './drop-table-dialog'
import { RenameFolderDialog } from './rename-folder-dialog'
import { RenameTableDialog } from './rename-table-dialog'

const treeVariants = {
  visible: { opacity: 1, height: 'auto' },
  hidden: { opacity: 0, height: 0 },
}

const treeTransition = {
  layout: { duration: 0.15, ease: 'easeInOut' as const },
  opacity: { duration: 0.1 },
  height: { duration: 0.1 },
}

const MotionSeparator = motion.create(Separator)

function Skeleton() {
  return (
    <div className="w-full space-y-3">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={`skeleton-${i}`} className="flex h-5 items-center gap-2 px-2">
          <div className="h-full w-5 shrink-0 animate-pulse rounded-md bg-muted" />
          <div
            className="h-full animate-pulse rounded-md bg-muted"
            style={{ width: `${Math.random() * 40 + 60 - 30}%` }}
          />
        </div>
      ))}
    </div>
  )
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

function FolderItem({ schema, folder, tables, search, onRename, onDelete, onRemoveTable, onRenameTable, onDropTable }: {
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

function TableItem({ schema, table, pinned = false, search, onRename, onDrop, onAddToFolder }: {
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

function UnpinnedTablesDropZone({ schema, children }: { schema: string, children: React.ReactNode }) {
  const { database } = Route.useRouteContext()
  const store = databaseStore(database.id)
  const selectedTables = useStore(store, state => state.selectedTables)
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
        const tablesInFolders = tablesToMove.filter(table =>
          tableFolders.some(folder => folder.tables.includes(table)),
        )

        if (tablesInFolders.length === 0) {
          return
        }

        tablesToMove.forEach((table) => {
          tableFolders.forEach((folder) => {
            if (folder.tables.includes(table)) {
              removeTableFromFolder(database.id, schema, folder.folder, table)
            }
          })
        })

        if (selectedTables.length > 0) {
          clearTableSelection(database.id)
        }

        toast.success(
          tablesInFolders.length === 1
            ? `Table "${tablesInFolders[0]}" removed from folder`
            : `${tablesInFolders.length} tables removed from folders`,
        )
      }
    }
    catch (error) {
      console.error('Failed to parse drop data:', error)
    }
  }

  return (
    <div
      className={cn(
        'relative rounded-md transition-colors',
        isDragOver && 'bg-accent/20 ring-2 ring-primary/30',
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      {isDragOver && (
        <div className={`
          pointer-events-none absolute inset-0 flex items-center justify-center
          rounded-md border-2 border-dashed border-primary bg-primary/5
        `}
        >
          <span className="text-sm font-medium text-primary">
            Drop to remove from folder
          </span>
        </div>
      )}
    </div>
  )
}

export function TablesTree({ className, search }: { className?: string, search?: string }) {
  const { database } = Route.useRouteContext()
  const { data: tablesAndSchemas, isPending } = useDatabaseTablesAndSchemas({ database })
  const { schema: schemaParam } = useSearch({ from: '/(protected)/_protected/database/$id/table/' })
  const store = databaseStore(database.id)
  const tablesTreeOpenedSchemas = useStore(store, state => state.tablesTreeOpenedSchemas ?? [tablesAndSchemas?.schemas[0]?.name ?? 'public'])
  const pinnedTables = useStore(store, state => state.pinnedTables)
  const tableFolders = useStore(store, state => state.tableFolders)
  const selectedTables = useStore(store, state => state.selectedTables)
  const dropTableDialogRef = useRef<ComponentRef<typeof DropTableDialog>>(null)
  const renameTableDialogRef = useRef<ComponentRef<typeof RenameTableDialog>>(null)
  const addToFolderDialogRef = useRef<ComponentRef<typeof AddToFolderDialog>>(null)
  const renameFolderDialogRef = useRef<ComponentRef<typeof RenameFolderDialog>>(null)
  const deleteFolderDialogRef = useRef<ComponentRef<typeof DeleteFolderDialog>>(null)

  useEffect(() => {
    if (!tablesAndSchemas)
      return

    cleanupPinnedTables(database.id, tablesAndSchemas.schemas.flatMap(schema => schema.tables.map(table => ({ schema: schema.name, table }))))
  }, [database, tablesAndSchemas])

  const filteredTablesAndSchemas = useMemo(() => {
    if (!tablesAndSchemas)
      return []

    const schemas = tablesAndSchemas.schemas
      .map(schema => ({
        ...schema,
        tables: schema.tables.filter(table =>
          !search
          || table.toLowerCase().includes(search.toLowerCase()),
        ).toSorted((a, b) => a.localeCompare(b)),
      }))
      .filter(schema => schema.tables.length)

    const pinnedSet = new Set(pinnedTables.map(t => `${t.schema}:${t.table}`))

    return schemas.map((schema) => {
      const pinned: string[] = []
      const unpinned: string[] = []
      const groupedTables = new Set<string>()

      const schemaFolders = tableFolders.filter(g => g.schema === schema.name)

      schemaFolders.forEach((folder) => {
        folder.tables.forEach((table) => {
          if (schema.tables.includes(table)) {
            groupedTables.add(table)
          }
        })
      })

      schema.tables.forEach((table) => {
        if (groupedTables.has(table)) {
          return
        }

        const isPinned = pinnedSet.has(`${schema.name}:${table}`)
        if (isPinned) {
          pinned.push(table)
        }
        else {
          unpinned.push(table)
        }
      })

      return {
        ...schema,
        pinnedTables: pinned,
        unpinnedTables: unpinned,
        folders: schemaFolders.map(folder => ({
          name: folder.folder,
          tables: folder.tables.filter(t => schema.tables.includes(t)),
        })),
      }
    })
  }, [search, tablesAndSchemas, pinnedTables, tableFolders])

  const searchAccordionValue = useMemo(() => search
    ? filteredTablesAndSchemas.map(schema => schema.name)
    : tablesTreeOpenedSchemas, [search, filteredTablesAndSchemas, tablesTreeOpenedSchemas])

  return (
    <ScrollArea className={cn('h-full overflow-y-auto p-2', className)}>
      <DropTableDialog
        ref={dropTableDialogRef}
        database={database}
      />
      <RenameTableDialog
        ref={renameTableDialogRef}
        database={database}
      />
      <AddToFolderDialog
        ref={addToFolderDialogRef}
        database={database}
      />
      <RenameFolderDialog
        ref={renameFolderDialogRef}
        database={database}
      />
      <DeleteFolderDialog
        ref={deleteFolderDialogRef}
        database={database}
      />
      {selectedTables.length > 0 && (
        <div className={`
          mb-2 flex items-center gap-2 rounded-md border border-primary/20
          bg-primary/10 px-3 py-2
        `}
        >
          <span className="text-sm font-medium">
            {selectedTables.length}
            {' '}
            table
            {selectedTables.length > 1 ? 's' : ''}
            {' '}
            selected
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => clearTableSelection(database.id)}
            className="ml-auto h-6 px-2 text-xs"
          >
            Clear
          </Button>
        </div>
      )}
      <Accordion
        value={searchAccordionValue}
        onValueChange={(v) => {
          if (!search) {
            store.setState(state => ({
              ...state,
              tablesTreeOpenedSchemas: v,
            } satisfies typeof state))
          }
        }}
        data-mask
        type="multiple"
        className="w-full space-y-2"
      >
        {isPending
          ? (
              <div className={`
                flex h-full flex-1 flex-col items-center justify-center
                text-center
              `}
              >
                <Skeleton />
              </div>
            )
          : filteredTablesAndSchemas.length === 0
            ? (
                <div className={`
                  flex h-full flex-1 flex-col items-center justify-center py-8
                  text-center
                `}
                >
                  <RiTableLine className="mb-2 h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No tables found</p>
                </div>
              )
            : (
                <AnimatePresence>
                  {filteredTablesAndSchemas.map(schema => (
                    <motion.div
                      key={schema.name}
                      initial={search ? { opacity: 0, height: 0 } : false}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <AccordionItem
                        value={schema.name}
                        className="border-b-0"
                      >
                        <AccordionTrigger className={`
                          mb-1 cursor-pointer truncate px-2 py-1.5
                          hover:bg-accent/50 hover:no-underline
                        `}
                        >
                          <span className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <RiStackLine
                                    className={cn(
                                      `
                                        size-4 shrink-0 text-muted-foreground
                                        opacity-50
                                      `,
                                      schemaParam === schema.name && `
                                        text-primary opacity-100
                                      `,
                                    )}
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Schema
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {schema.name}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-0">
                          <AnimatePresence mode="popLayout">
                            {schema.pinnedTables.length > 0 && (
                              <div className="space-y-0.5">
                                {schema.pinnedTables.map(table => (
                                  <TableItem
                                    key={`${schema.name}:${table}`}
                                    schema={schema.name}
                                    table={table}
                                    pinned
                                    search={search}
                                    onRename={() => renameTableDialogRef.current?.rename(schema.name, table)}
                                    onDrop={() => dropTableDialogRef.current?.drop(schema.name, table)}
                                    onAddToFolder={() => addToFolderDialogRef.current?.addToFolder(schema.name, table)}
                                  />
                                ))}
                              </div>
                            )}
                            {schema.pinnedTables.length > 0 && (schema.unpinnedTables.length > 0 || schema.folders.length > 0) && (
                              <MotionSeparator
                                className="my-2 h-px!"
                                layout
                                variants={treeVariants}
                                initial={search ? treeVariants.hidden : false}
                                animate="visible"
                                exit="hidden"
                                transition={treeTransition}
                              />
                            )}
                            {schema.folders.map(folder => (
                              <FolderItem
                                key={`${schema.name}:${folder.name}`}
                                schema={schema.name}
                                folder={folder.name}
                                tables={folder.tables}
                                search={search}
                                onRename={() => renameFolderDialogRef.current?.rename(schema.name, folder.name)}
                                onDelete={() => deleteFolderDialogRef.current?.deleteFolder(schema.name, folder.name)}
                                onRemoveTable={table => removeTableFromFolder(database.id, schema.name, folder.name, table)}
                                onRenameTable={table => renameTableDialogRef.current?.rename(schema.name, table)}
                                onDropTable={table => dropTableDialogRef.current?.drop(schema.name, table)}
                              />
                            ))}
                            {schema.folders.length > 0 && schema.unpinnedTables.length > 0 && (
                              <MotionSeparator
                                className="my-2 h-px!"
                                layout
                                variants={treeVariants}
                                initial={search ? treeVariants.hidden : false}
                                animate="visible"
                                exit="hidden"
                                transition={treeTransition}
                              />
                            )}
                            {schema.unpinnedTables.length > 0 && (
                              <UnpinnedTablesDropZone schema={schema.name}>
                                <div className="space-y-0.5">
                                  {schema.unpinnedTables.map(table => (
                                    <TableItem
                                      key={`${schema.name}:${table}`}
                                      schema={schema.name}
                                      table={table}
                                      search={search}
                                      onRename={() => renameTableDialogRef.current?.rename(schema.name, table)}
                                      onDrop={() => dropTableDialogRef.current?.drop(schema.name, table)}
                                      onAddToFolder={() => addToFolderDialogRef.current?.addToFolder(schema.name, table)}
                                    />
                                  ))}
                                </div>
                              </UnpinnedTablesDropZone>
                            )}
                          </AnimatePresence>
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
      </Accordion>
    </ScrollArea>
  )
}
