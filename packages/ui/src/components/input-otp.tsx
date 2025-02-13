import { cn } from '@connnect/ui/lib/utils'
import { OTPInput, OTPInputContext } from 'input-otp'
import { Minus } from 'lucide-react'
import * as React from 'react'

function InputOTP({ ref, className, containerClassName, ...props }: React.ComponentPropsWithoutRef<typeof OTPInput> & { ref?: React.RefObject<React.ComponentRef<typeof OTPInput>> }) {
  return (
    <OTPInput
      ref={ref}
      containerClassName={cn(
        'flex items-center gap-2 has-disabled:opacity-50',
        containerClassName,
      )}
      className={cn('disabled:cursor-not-allowed', className)}
      {...props}
    />
  )
}
InputOTP.displayName = 'InputOTP'

function InputOTPGroup({ ref, className, ...props }: React.ComponentPropsWithoutRef<'div'> & { ref?: React.RefObject<React.ComponentRef<'div'>> }) {
  return <div ref={ref} className={cn('flex items-center', className)} {...props} />
}
InputOTPGroup.displayName = 'InputOTPGroup'

function InputOTPSlot({ ref, index, className, ...props }: React.ComponentPropsWithoutRef<'div'> & { index: number } & { ref: React.RefObject<React.ComponentRef<'div'>> }) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex h-9 w-9 items-center justify-center border-y border-r border-border text-sm shadow-xs transition-all first:rounded-l-md first:border-l last:rounded-r-md',
        isActive && 'z-10 ring-1 ring-ring',
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
}
InputOTPSlot.displayName = 'InputOTPSlot'

function InputOTPSeparator({ ref, ...props }: React.ComponentPropsWithoutRef<'div'> & { ref?: React.RefObject<React.ComponentRef<'div'>> }) {
  return (
    <div ref={ref} role="separator" {...props}>
      <Minus />
    </div>
  )
}
InputOTPSeparator.displayName = 'InputOTPSeparator'

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot }
