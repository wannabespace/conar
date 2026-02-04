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
import { useState } from 'react'
import QRCode from 'react-qr-code'
import { TOTP_LENGTH, TotpCodeInput } from '~/components/totp-code-input'
import { useTwoFactorSetup } from './use-two-factor'

export function EnableDialog({ open, onOpenChange }: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [step, setStep] = useState<'password' | 'setup'>('password')
  const { totpUri, enableTotp, verifyTotp, reset } = useTwoFactorSetup()

  const form = useForm({
    defaultValues: {
      password: '',
      code: '',
    },
    onSubmit: ({ value }) => {
      if (step === 'password') {
        enableTotp.mutate(value.password, {
          onSuccess: () => {
            setStep('setup')
            form.setFieldValue('password', '')
          },
        })
      }
      else {
        verifyTotp.mutate(value.code, {
          onSuccess: () => {
            onOpenChange(false)
            setStep('password')
            form.reset()
            reset()
          },
        })
      }
    },
  })

  const handleClose = (value: boolean) => {
    onOpenChange(value)
    if (!value) {
      setStep('password')
      form.reset()
      reset()
    }
  }

  const { isSubmitting: isPasswordSubmitting, values } = useStore(form.store, ({ isSubmitting, values }) => ({
    isSubmitting,
    values,
  }))
  const canSubmitPassword = Boolean(values.password?.trim())
  const canSubmitCode = (values.code?.length ?? 0) === TOTP_LENGTH

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'password' && (
          <form
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
          >
            <DialogHeader className="gap-1.5">
              <DialogTitle>Enable 2FA</DialogTitle>
              <DialogDescription>
                Enter your password to continue.
              </DialogDescription>
            </DialogHeader>
            <form.Field name="password">
              {field => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="enable-password">Password</Label>
                  <Input
                    id="enable-password"
                    type="password"
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    disabled={enableTotp.isPending}
                    autoComplete="current-password"
                    autoFocus
                    className="h-10"
                  />
                </div>
              )}
            </form.Field>
            <DialogFooter className="pt-2">
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={enableTotp.isPending || !canSubmitPassword || isPasswordSubmitting}
              >
                <LoadingContent loading={enableTotp.isPending}>Continue</LoadingContent>
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 'setup' && (
          <form
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
          >
            <DialogHeader className="gap-1.5">
              <DialogTitle>Scan QR Code</DialogTitle>
              <DialogDescription>
                Scan this with your authenticator app, then enter the 6-digit code.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-6">
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <QRCode value={totpUri} size={176} />
              </div>
              <form.Field name="code">
                {field => (
                  <div className="w-full">
                    <TotpCodeInput
                      label="Verification code"
                      value={field.state.value}
                      onChange={value => field.handleChange(value)}
                      disabled={verifyTotp.isPending}
                    />
                  </div>
                )}
              </form.Field>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={verifyTotp.isPending || !canSubmitCode}
              >
                <LoadingContent loading={verifyTotp.isPending}>Verify</LoadingContent>
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
