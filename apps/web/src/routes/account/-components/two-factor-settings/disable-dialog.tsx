import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@conar/ui/components/dialog'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { useForm, useStore } from '@tanstack/react-form'
import { useTwoFactorDisable } from './use-two-factor'

interface DisableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DisableDialog({ open, onOpenChange }: DisableDialogProps) {
  const { disableTotp } = useTwoFactorDisable()

  const form = useForm({
    defaultValues: {
      password: '',
    },
    onSubmit: ({ value }) => {
      disableTotp.mutate(value.password, {
        onSuccess: () => {
          onOpenChange(false)
          form.reset()
        },
      })
    },
  })

  const handleClose = (value: boolean) => {
    onOpenChange(value)
    if (!value) {
      form.reset()
    }
  }

  const { isSubmitting, values } = useStore(form.store, ({ isSubmitting, values }) => ({
    isSubmitting,
    values,
  }))
  const canSubmit = Boolean(values.password?.trim())

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <DialogHeader className="gap-1.5">
            <DialogTitle>Disable 2FA</DialogTitle>
            <DialogDescription>
              Enter your password to turn off two-factor authentication.
            </DialogDescription>
          </DialogHeader>
          <form.Field name="password">
            {field => (
              <div className="flex flex-col gap-2">
                <Label htmlFor="disable-password">Password</Label>
                <Input
                  id="disable-password"
                  type="password"
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
                  disabled={disableTotp.isPending}
                  autoComplete="current-password"
                  autoFocus
                  className="h-10"
                />
              </div>
            )}
          </form.Field>
          <DialogFooter className="pt-2">
            <Button variant="outline" type="button" onClick={() => handleClose(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="w-full sm:w-auto"
              disabled={disableTotp.isPending || !canSubmit || isSubmitting}
            >
              <LoadingContent loading={disableTotp.isPending}>Disable</LoadingContent>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
