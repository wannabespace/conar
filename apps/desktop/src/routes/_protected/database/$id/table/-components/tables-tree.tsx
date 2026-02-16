import type { ComponentRef } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@conar/ui/components/accordion'
import { Button } from '@conar/ui/components/button'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { ScrollArea } from '@conar/ui/components/scroll-area'
import { MotionSeparator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { copy as copyToClipboard } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiDeleteBin7Line, RiEditLine, RiFileCopyLine, RiFolderAddLine, RiMoreLine, RiPushpinFill, RiPushpinLine, RiStackLine, RiTableLine } from '@remixicon/react'
import { useSearch } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { AnimatePresence, motion } from 'motion/react'
import * as React from 'react'
import { useEffect, useMemo, useRef } from 'react'
import { SidebarLink } from '~/components/sidebar-link'
import { useConnectionTablesAndSchemas } from '~/entities/connection/queries'
import { addTab, cleanupPinnedTables, clearTableSelection, connectionStore, removeTableFromFolder, togglePinTable, toggleTableSelection } from '~/entities/connection/store'
import { Route } from '..'
import { AddToFolderDialog } from './add-to-folder-dialog'
import { DeleteFolderDialog } from './delete-folder-dialog'
import { DropTableDialog } from './drop-table-dialog'
import { FolderItem } from './folder-item'
import { RenameFolderDialog } from './rename-folder-dialog'
import { RenameTableDialog } from './rename-table-dialog'
import { UnpinnedTablesDropZone } from './unpinned-tables-dropzone'

const treeVariants = {
  visible: { opacity: 1, height: 'auto' },
  hidden: { opacity: 0, height: 0 },
}

const treeTransition = {
  layout: { duration: 0.15, ease: 'easeInOut' as const },
  opacity: { duration: 0.1 },
  height: { duration: 0.1 },
}

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
  const { connection } = Route.useRouteContext()
  const store = connectionStore(connection.id)
  const selectedTables = useStore(store, state => state.selectedTables)
  const isSelected = selectedTables.some(t => t.schema === schema && t.table === table)

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      toggleTableSelection(connection.id, schema, table)
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
    <SidebarLink
      to="/database/$id/table"
      params={{ id: connection.id }}
      search={{ schema, table }}
      preloadDelay={200}
      onClick={handleClick}
      onDoubleClick={() => addTab(connection.id, schema, table)}
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
      {({ isActive }) => (
        <>
          <RiTableLine
            className={cn(
              'size-4 shrink-0 text-muted-foreground opacity-50',
              isActive && 'text-primary opacity-100',
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
              isActive && 'hover:bg-primary/10',
            )}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              togglePinTable(connection.id, schema, table)
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
                  isActive && 'hover:bg-primary/10',
                )}
                onClick={e => e.stopPropagation()}
              >
                <RiMoreLine className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-48"
              onCloseAutoFocus={e => e.preventDefault()}
            >
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
                <RiFolderAddLine className="size-4" />
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
        </>
      )}
    </SidebarLink>
  )
}

export function TablesTree({ className, search }: { className?: string, search?: string }) {
  const { connection } = Route.useRouteContext()
  const store = connectionStore(connection.id)
  const showSystem = useStore(store, state => state.showSystem)
  const { data: tablesAndSchemas, isPending } = useConnectionTablesAndSchemas({ connection, showSystem })
  const { schema: schemaParam } = useSearch({ from: '/_protected/database/$id/table/' })
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

    cleanupPinnedTables(connection.id, tablesAndSchemas.schemas.flatMap(schema => schema.tables.map(table => ({ schema: schema.name, table }))))
  }, [connection, tablesAndSchemas])

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
      />
      <RenameTableDialog
        ref={renameTableDialogRef}
      />
      <AddToFolderDialog
        ref={addToFolderDialogRef}
        connection={connection}
      />
      <RenameFolderDialog
        ref={renameFolderDialogRef}
        connection={connection}
      />
      <DeleteFolderDialog
        ref={deleteFolderDialogRef}
        connection={connection}
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
            onClick={() => clearTableSelection(connection.id)}
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
                  <RiTableLine className="mb-2 size-10 text-muted-foreground" />
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
                                onRemoveTable={table => removeTableFromFolder(connection.id, schema.name, folder.name, table)}
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
