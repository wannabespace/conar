import { Dialog, DialogContent } from '@tamery/ui/components/dialog'

import { SharePicker } from './share-picker'

export const ShareDialog = ({
  onOpenChange,
  open,
  ...target
}: {
  onOpenChange: (open: boolean) => void
  open: boolean
  schema: string
  table: string
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <SharePicker {...target} />
    </DialogContent>
  </Dialog>
)
