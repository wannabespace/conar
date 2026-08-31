import { Dithering } from '@paper-design/shaders-react'
import { cn } from '@tamery/ui/lib/utils'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { createMediaQuery } from 'seitu/web'

import { useResolvedTheme } from '../../theme-store'

const DITHER_COLORS = {
  dark: { back: '#16181c', front: '#454649' },
  light: { back: '#f3f3f5', front: '#c2c3c4' },
}

const SHADER_MOUNT_DELAY = 700

const reducedMotionQuery = createMediaQuery({
  query: '(prefers-reduced-motion: reduce)',
})

export const DitherBackground = ({
  className,
  shape = 'warp',
}: {
  className?: string
  shape?: 'warp' | 'ripple'
}) => {
  const theme = useResolvedTheme()
  const [isShaderMounted, setIsShaderMounted] = useState(false)
  const prefersReducedMotion = useSubscription(reducedMotionQuery)
  const colors = DITHER_COLORS[theme]

  useEffect(() => {
    const timeout = setTimeout(
      () => setIsShaderMounted(true),
      SHADER_MOUNT_DELAY
    )

    return () => clearTimeout(timeout)
  }, [])

  return (
    <div
      aria-hidden
      className={cn(
        `pointer-events-none absolute inset-0 mask-[linear-gradient(to_bottom,#000_70%,transparent_100%)]`,
        className
      )}
    >
      {isShaderMounted && (
        <motion.div
          className="size-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
        >
          <Dithering
            colorBack={colors.back}
            colorFront={colors.front}
            shape={shape}
            type="8x8"
            size={4}
            speed={prefersReducedMotion ? 0 : 0.1}
            style={{ height: '100%', width: '100%' }}
          />
        </motion.div>
      )}
    </div>
  )
}
