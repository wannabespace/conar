import type { connections } from '~/drizzle'
import { Alert, AlertDescription, AlertTitle } from '@conar/ui/components/alert'
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
import { RiAlertLine } from '@remixicon/react'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { deleteFolder } from '~/entities/connection/store'

interface DeleteFolderDialogProps {
  ref: React.RefObject<{
    deleteFolder: (schema: string, folder: string) => void
  } | null>
  connection: typeof connections.$inferSelect
}

export function DeleteFolderDialog({ ref, connection }: DeleteFolderDialogProps) {
  const [confirmationText, setConfirmationText] = useState('')
  const [schema, setSchema] = useState('')
  const [folder, setFolder] = useState('')
  const [open, setOpen] = useState(false)

  useImperativeHandle(ref, () => ({
    deleteFolder: (schema, folder) => {
      setSchema(schema)
      setFolder(folder)
      setConfirmationText('')
      setOpen(true)
    },
  }))

  const handleDelete = () => {
    deleteFolder(connection.id, schema, folder)
    toast.success(`Folder "${folder}" successfully deleted`)
    setOpen(false)
    setConfirmationText('')
  }

  const canConfirm = confirmationText === folder

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Delete Folder
          </DialogTitle>
          <div className="space-y-4">
            <Alert variant="destructive">
              <RiAlertLine className="size-5 text-destructive" />
              <AlertTitle>This will delete the folder organization.</AlertTitle>
              <AlertDescription>
                The tables inside this folder will not be deleted, only the folder organization will be removed.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="confirmation">
                Type
                {' '}
                <span className="font-mono font-semibold">
                  {folder}
                </span>
                {' '}
                to confirm
              </Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={e => setConfirmationText(e.target.value)}
                placeholder={folder}
                autoComplete="off"
              />
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={!canConfirm}
            onClick={handleDelete}
          >
            Delete Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
