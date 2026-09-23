import { GrainGradient } from '@paper-design/shaders-react'
import { cn } from '@tamery/ui/lib/utils'
import { useSubscription } from 'seitu/react'
import { createMediaQuery } from 'seitu/web'

import { useResolvedTheme } from '../../theme-store'

const GRAIN_COLORS = {
  dark: [
    'rgba(255, 255, 255, 0)',
    'rgba(255, 255, 255, 0.18)',
    'rgba(255, 255, 255, 0.04)',
    'rgba(255, 255, 255, 0.12)',
  ],
  light: [
    'rgba(0, 0, 0, 0)',
    'rgba(0, 0, 0, 0.12)',
    'rgba(0, 0, 0, 0.03)',
    'rgba(0, 0, 0, 0.08)',
  ],
}

const reducedMotionQuery = createMediaQuery({
  query: '(prefers-reduced-motion: reduce)',
})

export const GrainBackground = ({ className }: { className?: string }) => {
  const theme = useResolvedTheme()
  const prefersReducedMotion = useSubscription(reducedMotionQuery)

  return (
    <div
      aria-hidden
      className={cn(
        `pointer-events-none absolute inset-0 mask-[linear-gradient(to_bottom,#000_70%,transparent_100%)]`,
        className
      )}
    >
      <GrainGradient
        colorBack="rgba(0, 0, 0, 0)"
        colors={GRAIN_COLORS[theme]}
        shape="corners"
        softness={0.6}
        intensity={0.7}
        noise={0.35}
        speed={prefersReducedMotion ? 0 : 1.5}
        minPixelRatio={1}
        maxPixelCount={1280 * 800}
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  )
}
