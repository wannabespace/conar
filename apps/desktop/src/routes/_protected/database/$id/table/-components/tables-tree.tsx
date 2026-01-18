import type { ComponentRef } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@conar/ui/components/accordion'
import { Button } from '@conar/ui/components/button'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Separator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiStackLine, RiTableLine } from '@remixicon/react'
import { useSearch } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'
import { useDatabaseTablesAndSchemas } from '~/entities/database/queries'
import { cleanupPinnedTables, clearTableSelection, databaseStore, removeTableFromFolder } from '~/entities/database/store'
import { Route } from '..'
import { AddToFolderDialog } from './add-to-folder-dialog'
import { DeleteFolderDialog } from './delete-folder-dialog'
import { DropTableDialog } from './drop-table-dialog'
import { FolderItem } from './folder-item'
import { RenameFolderDialog } from './rename-folder-dialog'
import { RenameTableDialog } from './rename-table-dialog'
import { TableItem } from './table-item'
import { TablesTreeSkeleton as Skeleton } from './tables-tree-skeleton'
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

const MotionSeparator = motion.create(Separator)

export function TablesTree({ className, search }: { className?: string, search?: string }) {
  const { database } = Route.useRouteContext()
  const { data: tablesAndSchemas, isPending } = useDatabaseTablesAndSchemas({ database })
  const { schema: schemaParam } = useSearch({ from: '/_protected/database/$id/table/' })
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
