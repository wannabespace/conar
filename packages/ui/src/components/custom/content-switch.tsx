import { noop } from '@tamery/shared/utils/helpers'
import { useMountedEffect } from '@tamery/ui/hookas/use-mounted-effect'
import { AnimatePresence, motion } from 'motion/react'
import { useEffectEvent, useState } from 'react'

export const ContentSwitch = ({
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
}) => {
  const [isActive, setIsActive] = useState(false)

  const onSwitchEndEvent = useEffectEvent(onSwitchEnd)

  useMountedEffect(() => {
    if (active) {
      // oxlint-disable-next-line react/set-state-in-effect
      setIsActive(true)
    }

    const timeout = setTimeout(() => {
      setIsActive(false)
      onSwitchEndEvent(false)
    }, 3000)

    return () => clearTimeout(timeout)
  }, [active])

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {isActive ? (
        <motion.span
          key="active"
          className={className}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.1 }}
        >
          {activeContent}
        </motion.span>
      ) : (
        <motion.span
          key="default"
          className={className}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.1 }}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  )
}
