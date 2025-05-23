import { useMountedEffect } from '@connnect/ui/hookas/use-mounted-effect'
import { cn } from '@connnect/ui/lib/utils'
import { useState } from 'react'

export function ContentSwitch({
  children,
  activeContent,
  active = true,
}: {
  children: React.ReactNode
  activeContent: React.ReactNode
  active?: boolean
}) {
  const [isActive, setIsActive] = useState(false)

  useMountedEffect(() => {
    if (active) {
      setIsActive(true)
    }

    const timeout = setTimeout(() => {
      setIsActive(false)
    }, 1500)

    return () => clearTimeout(timeout)
  }, [active])

  return (
    <div className="relative">
      <div
        className={cn(
          'transition-all',
          !isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          'absolute inset-0 transition-all',
          !isActive ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
        )}
      >
        {activeContent}
      </div>
    </div>
  )
}
