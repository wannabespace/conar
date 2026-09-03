import { MinusSignIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { cn } from '@tamery/ui/lib/utils'
import { OTPInput, OTPInputContext } from 'input-otp'
import * as React from 'react'

const InputOTP = ({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string
}) => (
  <OTPInput
    data-slot="input-otp"
    containerClassName={cn(
      `flex items-center has-disabled:opacity-50`,
      containerClassName
    )}
    spellCheck={false}
    className={cn('disabled:cursor-not-allowed', className)}
    {...props}
  />
)

const InputOTPGroup = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => (
  <div
    data-slot="input-otp-group"
    className={cn(
      `has-aria-invalid:border-destructive/60 has-aria-invalid:ring-destructive/30 flex items-center rounded-2xl has-aria-invalid:ring-3`,
      className
    )}
    {...props}
  />
)

const InputOTPSlot = ({
  index,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  index: number
}) => {
  const inputOTPContext = React.use(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        `border-input bg-input aria-invalid:border-destructive/60 data-[active=true]:border-ring data-[active=true]:ring-ring/30 data-[active=true]:aria-invalid:ring-destructive/30 relative flex size-8 items-center justify-center border-y border-r text-sm transition-[color,box-shadow] duration-200 outline-none first:rounded-l-2xl first:border-l last:rounded-r-2xl data-[active=true]:z-10 data-[active=true]:ring-3`,
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  )
}

const InputOTPSeparator = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => (
  <div
    data-slot="input-otp-separator"
    className={cn(
      "flex items-center [&_svg:not([class*='size-'])]:size-4",
      className
    )}
    {...props}
  >
    <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} />
  </div>
)

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot }
