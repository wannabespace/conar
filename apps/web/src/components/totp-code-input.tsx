import type { ComponentProps } from 'react'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@conar/ui/components/input-otp'
import { Label } from '@conar/ui/components/label'
import { useId } from 'react'

const TOTP_LENGTH = 6

export function TotpCodeInput({
  label,
  ...props
}: { label?: string } & Omit<ComponentProps<typeof InputOTP>, 'maxLength' | 'id' | 'children' | 'render'>) {
  const id = useId()

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </Label>
      <InputOTP
        id={id}
        maxLength={TOTP_LENGTH}
        {...props}
      >
        <InputOTPGroup>
          {Array.from({ length: TOTP_LENGTH }, (_, i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  )
}
