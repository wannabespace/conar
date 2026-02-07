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
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

export function DisableTfaDialog({ open, onOpenChange }: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { mutate, isPending } = useMutation({
    mutationFn: async (password: string) => {
      const { error } = await authClient.twoFactor.disable({ password })

      if (error) {
        throw error
      }
    },
    onSuccess: async () => {
      toast.success('2FA disabled')
    },
    onError: handleError,
  })

  const form = useForm({
    defaultValues: {
      password: '',
    },
    onSubmit: ({ value }) => mutate(value.password),
  })

  const canSubmit = useStore(form.store, state => state.canSubmit)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  disabled={isPending}
                  autoComplete="current-password"
                  autoFocus
                  className="h-10"
                />
              </div>
            )}
          </form.Field>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              className="
                w-full
                sm:w-auto
              "
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="
                w-full
                sm:w-auto
              "
              disabled={isPending || !canSubmit}
            >
              <LoadingContent loading={isPending}>Disable</LoadingContent>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
