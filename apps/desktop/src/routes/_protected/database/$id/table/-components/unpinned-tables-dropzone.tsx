import { cn } from '@conar/ui/lib/utils'
import { useStore } from '@tanstack/react-store'
import * as React from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import { clearTableSelection, connectionStore, removeTableFromFolder } from '~/entities/connection/store'
import { Route } from '..'

export function UnpinnedTablesDropZone({ schema, children }: { schema: string, children: React.ReactNode }) {
  const { connection } = Route.useRouteContext()
  const store = connectionStore(connection.id)
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
              removeTableFromFolder(connection.id, schema, folder.folder, table)
            }
          })
        })

        if (selectedTables.length > 0) {
          clearTableSelection(connection.id)
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
