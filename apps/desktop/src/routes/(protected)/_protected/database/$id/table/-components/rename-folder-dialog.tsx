import type { databases } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@conar/ui/components/dialog'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { folderExists, renameFolder } from '~/entities/database/store'

interface RenameFolderDialogProps {
  ref: React.RefObject<{
    rename: (schema: string, folder: string) => void
  } | null>
  database: typeof databases.$inferSelect
}

export function RenameFolderDialog({ ref, database }: RenameFolderDialogProps) {
  const [schema, setSchema] = useState('')
  const [folder, setFolder] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [open, setOpen] = useState(false)

  useImperativeHandle(ref, () => ({
    rename: (schema: string, folder: string) => {
      setSchema(schema)
      setFolder(folder)
      setNewFolderName(folder)
      setOpen(true)
    },
  }))

  const handleRename = () => {
    if (!newFolderName.trim()) {
      toast.error('Folder name cannot be empty')
      return
    }

    if (newFolderName.trim() === folder) {
      setOpen(false)
      return
    }

    if (folderExists(database.id, schema, newFolderName.trim())) {
      toast.error(`A folder named "${newFolderName.trim()}" already exists in this schema`)
      return
    }

    const success = renameFolder(database.id, schema, folder, newFolderName.trim())

    if (success) {
      toast.success(`Folder "${folder}" renamed to "${newFolderName.trim()}"`)
      setOpen(false)
    }
    else {
      toast.error('Failed to rename folder')
    }
  }

  const canConfirm = newFolderName.trim() !== '' && newFolderName.trim() !== folder

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Rename Folder
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              placeholder="Enter folder name..."
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canConfirm) {
                  e.preventDefault()
                  handleRename()
                }
              }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleRename}
            disabled={!canConfirm}
          >
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
