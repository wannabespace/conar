import { noop } from '@conar/shared/utils/helpers'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { cn } from '@conar/ui/lib/utils'
import { useEffectEvent, useState } from 'react'

export function ContentSwitch({
  children,
  className,
  activeContent,
  active = true,
  onSwitchEnd = noop,
}: {
  children: React.ReactNode
  className?: string
  activeContent: React.ReactNode
  onSwitchEnd?: (active: boolean) => void
  active?: boolean
}) {
  const [isActive, setIsActive] = useState(false)

  const onSwitchEndEvent = useEffectEvent(onSwitchEnd)

  useMountedEffect(() => {
    if (active) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setIsActive(true)
    }

    const timeout = setTimeout(() => {
      setIsActive(false)
      // eslint-disable-next-line react-hooks/rules-of-hooks
      onSwitchEndEvent(false)
    }, 3000)

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
