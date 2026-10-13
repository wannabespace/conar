import { cn } from '@tamery/ui/lib/utils'
import { motion, useAnimationControls, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { useRef } from 'react'

import { Reveal } from '~/components/reveal'
import { pageCardClass } from '~/utils/card'

const REPLAY_COOLDOWN_MS = 2500

export const BentoCard = ({
  children,
  className,
  description,
  title,
}: {
  children: ReactNode
  className?: string
  description: string
  title: string
}) => {
  const controls = useAnimationControls()
  const lastPlayedAt = useRef(-Infinity)
  const reduceMotion = useReducedMotion()

  const play = () => {
    if (reduceMotion) {
      controls.set('shown')
      return
    }
    if (performance.now() - lastPlayedAt.current < REPLAY_COOLDOWN_MS) {
      return
    }
    lastPlayedAt.current = performance.now()
    controls.set('hidden')
    void controls.start('shown')
  }

  return (
    <Reveal className={cn('flex', className)}>
      <motion.article
        initial="hidden"
        animate={controls}
        viewport={{ amount: 0.6, once: true }}
        onViewportEnter={play}
        onHoverStart={play}
        onTap={play}
        className={cn(
          pageCardClass,
          'relative isolate flex min-h-80 flex-1 flex-col overflow-hidden'
        )}
      >
        <header className="relative z-10 flex flex-col gap-1 p-6 pb-0">
          <h3 className="text-base font-medium">{title}</h3>
          <p className="text-muted-foreground max-w-sm text-sm text-pretty">
            {description}
          </p>
        </header>
        <div aria-hidden className="relative min-h-48 flex-1 select-none">
          {children}
        </div>
      </motion.article>
    </Reveal>
  )
}
