import { noop } from '@conar/shared/utils/helpers'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

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

  useMountedEffect(() => {
    if (active) {
      setIsActive(true)
    }

    const timeout = setTimeout(() => {
      setIsActive(false)
      onSwitchEnd(false)
    }, 3000)

    return () => clearTimeout(timeout)
  }, [active, onSwitchEnd])

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {isActive ? (
        <motion.span
          key="active"
          className={className}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          {activeContent}
        </motion.span>
      ) : (
        <motion.span
          key="default"
          className={className}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  )
}
