import type { databases } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@conar/ui/components/dialog'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { databasesCollection } from '~/entities/database'

interface RenameConnectionDialogProps {
  ref?: React.RefObject<{
    rename: (database: typeof databases.$inferSelect) => void
  } | null>
}

export function RenameConnectionDialog({ ref }: RenameConnectionDialogProps) {
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

  function rename(e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLInputElement>) {
    if (!database)
      return

    e.preventDefault()
    databasesCollection.update(database.id, (draft) => {
      draft.name = newName.trim()
    })
    toast.success(`Connection renamed to "${newName.trim()}"`)
    setOpen(false)
  }

  const canConfirm = newName.trim() !== '' && newName.trim() !== database?.name

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Connection</DialogTitle>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newDatabaseName" className="font-normal">
                Connection name
              </Label>
              <Input
                id="newDatabaseName"
                value={newName}
                placeholder="Enter new connection name"
                spellCheck={false}
                autoComplete="off"
                onChange={e => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canConfirm) {
                    rename(e)
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
            onClick={(e) => {
              if (canConfirm) {
                rename(e)
              }
            }}
          >
            Rename Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
