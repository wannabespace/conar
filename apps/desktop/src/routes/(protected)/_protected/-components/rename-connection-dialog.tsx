import type { databases } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@conar/ui/components/dialog'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { RiCloseLine } from '@remixicon/react'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { databasesCollection } from '~/entities/database'
import { labelOptions, colorOptions as predefinedColors } from '../constant'

interface RenameConnectionDialogProps {
  ref?: React.RefObject<{
    rename: (database: typeof databases.$inferSelect) => void
  } | null>
}

export function RenameConnectionDialog({ ref }: RenameConnectionDialogProps) {
  const [open, setOpen] = useState(false)
  const [database, setDatabase] = useState<typeof databases.$inferSelect | null>(null)
  const [newName, setNewName] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newColor, setNewColor] = useState('')

  useImperativeHandle(ref, () => ({
    rename: (db: typeof databases.$inferSelect) => {
      setDatabase(db)
      setNewName(db.name)
      setNewLabel(db.label || '')
      setNewColor(db.color || '')
      setOpen(true)
    },
  }), [])

  function rename(e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLInputElement>) {
    if (!database)
      return

    e.preventDefault()
    databasesCollection.update(database.id, (draft) => {
      draft.name = newName.trim()
      draft.label = newLabel.trim() || null
      draft.color = newColor.trim() || null
    })
    toast.success(`Connection renamed to "${newName.trim()}"`)
    setOpen(false)
  }

  const canConfirm = (newName.trim() !== '' && newName.trim() !== database?.name) || (newLabel.trim() !== (database?.label || '') || (newColor.trim() !== (database?.color || '')))

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

            <div className="space-y-2">
              <Label htmlFor="newDatabaseLabel" className="font-normal">
                Connection label (optional)
              </Label>
              <Input
                id="newDatabaseLabel"
                value={newLabel}
                placeholder="Enter a label or select from options below"
                spellCheck={false}
                autoComplete="off"
                onChange={e => setNewLabel(e.target.value)}
              />
              <div className="flex flex-wrap gap-2 mt-1">
                {labelOptions.map(option => (
                  <Button
                    key={option}
                    type="button"
                    variant={newLabel === option ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewLabel(option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              <div className="text-xs text-muted-foreground/70 mt-1">
                Labels help distinguish between different environments (dev, prod, staging, etc.)
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-normal">
                Connection color (optional)
              </Label>
              <div className="flex flex-wrap gap-2 mt-1">
                <button
                  type="button"
                  className={`w-6 h-6 rounded-full border ${!newColor ? 'bg-muted border-primary' : 'border-border'}`}
                  onClick={() => setNewColor('')}
                >
                  {!newColor && (
                    <RiCloseLine className="size-4 text-muted-foreground" />
                  )}
                </button>
                {predefinedColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded-full transition-all"
                    style={{
                      backgroundColor: color,
                      boxShadow: newColor === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : 'none',
                    }}
                    onClick={() => setNewColor(color)}
                  />
                ))}
              </div>
              <div className="text-xs text-muted-foreground/70 mt-1">
                Colors help visually distinguish between different connections
              </div>
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
