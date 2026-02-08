import type { connections } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogPanel, DialogTitle } from '@conar/ui/components/dialog'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { connectionsCollection } from '~/entities/connection/sync'

interface RenameConnectionDialogProps {
  ref?: React.RefObject<{
    rename: (connection: typeof connections.$inferSelect) => void
  } | null>
}

export function RenameConnectionDialog({ ref }: RenameConnectionDialogProps) {
  const [open, setOpen] = useState(false)
  const [connection, setConnection] = useState<typeof connections.$inferSelect | null>(null)
  const [newName, setNewName] = useState('')

  useImperativeHandle(ref, () => ({
    rename: (connection: typeof connections.$inferSelect) => {
      setConnection(connection)
      setNewName(connection.name)
      setOpen(true)
    },
  }), [])

  function rename(e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLInputElement>) {
    if (!connection)
      return

    e.preventDefault()
    connectionsCollection.update(connection.id, (draft) => {
      draft.name = newName.trim()
    })
    toast.success(`Connection renamed to "${newName.trim()}"`)
    setOpen(false)
  }

  const canConfirm = newName.trim() !== '' && newName.trim() !== connection?.name

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Connection</DialogTitle>
        </DialogHeader>
        <DialogPanel className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newConnectionName" className="font-normal">
              Connection name
            </Label>
            <Input
              id="newConnectionName"
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
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            disabled={!canConfirm}
            onClick={(e) => {
              if (canConfirm) {
                rename(e)
              }
            }}
          >
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
