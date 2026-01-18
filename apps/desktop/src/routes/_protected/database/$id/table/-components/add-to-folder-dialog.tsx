import type { databases } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@conar/ui/components/dialog'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { cn } from '@conar/ui/lib/utils'
import { RiAddLine, RiFolderLine } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { addTableToFolder, databaseStore } from '~/entities/database/store'

interface AddToFolderDialogProps {
  ref: React.RefObject<{
    addToFolder: (schema: string, table: string) => void
  } | null>
  database: typeof databases.$inferSelect
}

export function AddToFolderDialog({ ref, database }: AddToFolderDialogProps) {
  const [schema, setSchema] = useState('')
  const [table, setTable] = useState('')
  const [open, setOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)

  const store = databaseStore(database.id)
  const tableFolders = useStore(store, state => state.tableFolders)

  useImperativeHandle(ref, () => ({
    addToFolder: (schema: string, table: string) => {
      setSchema(schema)
      setTable(table)
      setNewFolderName('')
      setShowNewFolder(false)
      setOpen(true)
    },
  }))

  const existingFolders = tableFolders
    .filter(g => g.schema === schema)
    .map(g => g.folder)

  const handleAddToExistingFolder = (folder: string) => {
    addTableToFolder(database.id, schema, folder, table)
    toast.success(`Table "${table}" added to folder "${folder}"`)
    setOpen(false)
  }

  const handleCreateNewFolder = () => {
    if (!newFolderName.trim()) {
      toast.error('Folder name cannot be empty')
      return
    }

    if (existingFolders.includes(newFolderName.trim())) {
      toast.error('A folder with this name already exists')
      return
    }

    addTableToFolder(database.id, schema, newFolderName.trim(), table)
    toast.success(`Table "${table}" added to new folder "${newFolderName.trim()}"`)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Add "
            {table}
            " to Folder
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {existingFolders.length > 0 && (
            <div className="space-y-2">
              <Label>Select Existing Folder</Label>
              <ScrollArea className="max-h-50 rounded-md border">
                <div className="space-y-1 p-2">
                  {existingFolders.map(folder => (
                    <button
                      key={folder}
                      type="button"
                      onClick={() => handleAddToExistingFolder(folder)}
                      className={cn(
                        `
                          flex w-full items-center gap-2 rounded-md px-3 py-2
                          text-left text-sm transition-colors
                          hover:bg-accent
                        `,
                      )}
                    >
                      <RiFolderLine className="size-4 text-muted-foreground" />
                      <span>{folder}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="space-y-2">
            {!showNewFolder
              ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowNewFolder(true)}
                  >
                    <RiAddLine className="size-4" />
                    Create New Folder
                  </Button>
                )
              : (
                  <div className="space-y-2">
                    <Label htmlFor="new-folder-name">New Folder Name</Label>
                    <Input
                      id="new-folder-name"
                      placeholder="Enter folder name..."
                      value={newFolderName}
                      onChange={e => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleCreateNewFolder()
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleCreateNewFolder}
                        disabled={!newFolderName.trim()}
                        className="flex-1"
                      >
                        Create & Add
                      </Button>
                    </div>
                  </div>
                )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
