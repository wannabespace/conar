import type { Database } from '~/lib/indexeddb'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@conar/ui/components/dialog'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { useMutation } from '@tanstack/react-query'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { databasesQuery, renameDatabase } from '~/entities/database'
import { queryClient } from '~/main'

interface RenameDatabaseDialogProps {
  ref?: React.RefObject<{
    rename: (database: Database) => void
  } | null>
}

export function RenameDatabaseDialog({ ref }: RenameDatabaseDialogProps) {
  const [open, setOpen] = useState(false)
  const [database, setDatabase] = useState<Database | null>(null)
  const [newName, setNewName] = useState('')

  useImperativeHandle(ref, () => ({
    rename: (db: Database) => {
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
      queryClient.invalidateQueries({ queryKey: databasesQuery().queryKey })
    },
  })

  const canConfirm = newName.trim() !== '' && newName.trim() !== database?.name

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
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
                onChange={e => setNewName(e.target.value)}
                placeholder="Enter new database name"
                spellCheck={false}
                autoComplete="off"
                autoFocus
              />
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-2">
          <DialogClose asChild>
            <Button
              variant="outline"
              onClick={() => database && setNewName(database.name)}
              className="rounded-lg border border-input bg-background hover:bg-muted/70 text-foreground font-medium px-5 py-2 transition-all focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={() => rename()}
            disabled={!canConfirm || isPending}
            className="rounded-lg bg-primary text-primary-foreground font-semibold px-5 py-2 hover:bg-primary/90 transition-all focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
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
