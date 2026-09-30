import { Alert, AlertDescription } from '@tamery/ui/components/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@tamery/ui/components/alert-dialog'
import { Checkbox } from '@tamery/ui/components/checkbox'
import { MotionCollapse } from '@tamery/ui/components/collapse.motion'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { Label } from '@tamery/ui/components/label'
import { AnimatePresence } from 'motion/react'

export const DropDialog = ({
  cascadable,
  cascade,
  error,
  name,
  noun,
  onCascadeChange,
  onDrop,
  onOpenChange,
  open,
  pending,
}: {
  cascadable: boolean
  cascade: boolean
  error: Error | null
  name: string | undefined
  noun: string
  onCascadeChange: (cascade: boolean) => void
  onDrop: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  pending: boolean
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Drop {noun}?</AlertDialogTitle>
        <AlertDialogDescription>
          <span data-mask className="text-foreground font-medium">
            {name}
          </span>{' '}
          will be removed from the database. This cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      {cascadable && (
        <Label className="font-normal">
          <Checkbox
            checked={cascade}
            onCheckedChange={(checked) => onCascadeChange(checked === true)}
          />
          Also drop objects that depend on it (CASCADE)
        </Label>
      )}
      <AnimatePresence initial={false}>
        {error && (
          <MotionCollapse key="drop-error">
            <Alert variant="destructive">
              <AlertDescription data-mask className="wrap-break-word">
                {error.message}
              </AlertDescription>
            </Alert>
          </MotionCollapse>
        )}
      </AnimatePresence>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          variant="destructive"
          disabled={pending}
          onClick={onDrop}
        >
          <LoadingContent loading={pending}>Drop {noun}</LoadingContent>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)
