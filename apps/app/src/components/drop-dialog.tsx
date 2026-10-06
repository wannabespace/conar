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
import { MotionCollapse } from '@tamery/ui/components/collapse.motion'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { Switch } from '@tamery/ui/components/switch'
import { AnimatePresence } from 'motion/react'

import { OptionField } from './option-field'

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
        <OptionField
          htmlFor="drop-cascade"
          title="Cascade"
          description="Also drop the objects that depend on it."
        >
          <Switch
            id="drop-cascade"
            size="sm"
            checked={cascade}
            onCheckedChange={onCascadeChange}
          />
        </OptionField>
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
