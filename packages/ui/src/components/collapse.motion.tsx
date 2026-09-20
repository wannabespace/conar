import { cn } from '@tamery/ui/lib/utils'
import { motion } from 'motion/react'
import type { ComponentProps, ReactNode } from 'react'

const collapsed = { height: 0, opacity: 0 }
const expanded = { height: 'auto' as const, opacity: 1 }

const absorbStackGap = (node: HTMLDivElement | null) => {
  const parent = node?.previousElementSibling?.parentElement
  const inner = node?.firstElementChild
  if (!(parent && inner instanceof HTMLElement)) {
    return
  }
  const { flexDirection, rowGap } = getComputedStyle(parent)
  if (flexDirection !== 'column' || rowGap === 'normal') {
    return
  }
  node.style.marginTop = `-${rowGap}`
  inner.style.paddingTop = rowGap
}

export const MotionCollapse = ({
  children,
  className,
  ...props
}: ComponentProps<typeof motion.div> & { children: ReactNode }) => (
  <motion.div
    ref={absorbStackGap}
    initial={collapsed}
    animate={expanded}
    exit={collapsed}
    transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
    className={cn('overflow-hidden', className)}
    {...props}
  >
    <div>{children}</div>
  </motion.div>
)
