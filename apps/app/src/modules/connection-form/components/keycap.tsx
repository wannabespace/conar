import { KbdMotion } from '@tamery/ui/components/kbd.motion'
import type { ReactNode } from 'react'

export const Keycap = ({
  children,
  pressed,
}: {
  children: ReactNode
  pressed: boolean
}) => (
  <KbdMotion
    variant="keycap"
    size="lg"
    data-pressed={pressed || undefined}
    animate={pressed ? { scale: 0.95, y: 2 } : { scale: 1, y: 0 }}
    transition={{ duration: 0.1, ease: [0.32, 0.72, 0, 1] }}
  >
    {children}
  </KbdMotion>
)
