import type { databases } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@conar/ui/components/dialog'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { useMutation } from '@tanstack/react-query'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { renameDatabase } from '~/entities/database'

interface RenameDatabaseDialogProps {
  ref?: React.RefObject<{
    rename: (database: typeof databases.$inferSelect) => void
  } | null>
}

export function RenameDatabaseDialog({ ref }: RenameDatabaseDialogProps) {
  const [open, setOpen] = useState(false)
  const [database, setDatabase] = useState<typeof databases.$inferSelect | null>(null)
  const [newName, setNewName] = useState('')

  useImperativeHandle(ref, () => ({
    rename: (db: typeof databases.$inferSelect) => {
      setDatabase(db)
      setNewName(db.name)
      setOpen(true)
    },
  }), [])

  const { mutate: rename, isPending } = useMutation({
    mutationFn: () => database ? renameDatabase(database.id, newName.trim()) : Promise.resolve(),
    onSuccess: () => {
      toast.success(`Database renamed to "${newName.trim()}"`)
      setOpen(false)
    },
  })

  const canConfirm = newName.trim() !== '' && newName.trim() !== database?.name && !isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent asChild>
        <DialogHeader>
          <DialogTitle>Rename Database</DialogTitle>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newDatabaseName" className="font-normal">
                Database name
              </Label>
              <Input
                id="newDatabaseName"
                value={newName}
                placeholder="Enter new database name"
                spellCheck={false}
                autoComplete="off"
                onChange={e => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canConfirm) {
                    rename()
                  }
                }}
              />
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-2">
          <DialogClose asChild>
            <Button variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={!canConfirm}
            onClick={() => {
              if (canConfirm) {
                rename()
              }
            }}
          >
            <LoadingContent loading={isPending}>
              Rename Database
            </LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
