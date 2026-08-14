import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@tamery/ui/components/input-otp'
import { Label } from '@tamery/ui/components/label'
import type { ComponentProps } from 'react'
import { useId } from 'react'

const TOTP_LENGTH = 6
const TOTP_SLOTS = Array.from({ length: TOTP_LENGTH }, (_, i) => ({
  index: i,
  key: `slot-${i}`,
}))

export const TotpCodeInput = ({
  label,
  ...props
}: { label?: string } & Omit<
  ComponentProps<typeof InputOTP>,
  'maxLength' | 'id' | 'children' | 'render'
>) => {
  const id = useId()

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-muted-foreground text-sm">
        {label}
      </Label>
      <InputOTP id={id} maxLength={TOTP_LENGTH} {...props}>
        <InputOTPGroup>
          {TOTP_SLOTS.map((slot) => (
            <InputOTPSlot key={slot.key} index={slot.index} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  )
}
