import { cn } from '@tamery/ui/lib/utils'
import { motion } from 'motion/react'
import type { ComponentProps } from 'react'

export const MotionCollapse = ({
  className,
  gap = 0,
  ...props
}: ComponentProps<typeof motion.div> & { gap?: number }) => (
  <motion.div
    initial={{ height: 0, marginTop: -gap, opacity: 0 }}
    animate={{ height: 'auto', marginTop: 0, opacity: 1 }}
    exit={{ height: 0, marginTop: -gap, opacity: 0 }}
    transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
    className={cn('overflow-hidden', className)}
    {...props}
  />
)
