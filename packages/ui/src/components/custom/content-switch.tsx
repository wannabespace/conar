import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { cn } from '@conar/ui/lib/utils'
import { useState } from 'react'

export function ContentSwitch({
  children,
  className,
  activeContent,
  active = true,
  onSwitchEnd,
}: {
  children: React.ReactNode
  className?: string
  activeContent: React.ReactNode
  onSwitchEnd?: (active: boolean) => void
  active?: boolean
}) {
  const [isActive, setIsActive] = useState(false)

  useMountedEffect(() => {
    if (active) {
      setIsActive(true)
    }

    const timeout = setTimeout(() => {
      setIsActive(false)
      onSwitchEnd?.(false)
    }, 1500)

    return () => clearTimeout(timeout)
  }, [active])

  return (
    <span className={cn('relative flex items-center gap-1', className)}>
      <span
        className={cn(
          'transition-all',
          isActive ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
        )}
      >
        {children}
      </span>
      <span
        className={cn(
          'absolute inset-0 transition-all flex items-center justify-center',
          isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
        )}
      >
        {activeContent}
      </span>
    </span>
  )
}
