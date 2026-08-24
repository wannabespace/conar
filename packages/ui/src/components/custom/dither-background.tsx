import { Dithering } from '@paper-design/shaders-react'
import { useIsMounted } from '@tamery/ui/hookas/use-is-mounted'
import { cn } from '@tamery/ui/lib/utils'
import { useSubscription } from 'seitu/react'
import { createMediaQuery } from 'seitu/web'

import { useResolvedTheme } from '../../theme-store'

const DITHER_COLORS = {
  dark: { back: '#16181c', front: '#454649' },
  light: { back: '#f3f3f5', front: '#c2c3c4' },
}

const DITHER_MASKS = {
  bottom: 'mask-[linear-gradient(to_bottom,#000_70%,transparent_100%)]',
  edges: 'mask-[radial-gradient(ellipse_at_center,transparent_30%,#000_75%)]',
  none: '',
  radial: 'mask-[radial-gradient(ellipse_at_center,#000,transparent_70%)]',
}

const reducedMotionQuery = createMediaQuery({
  query: '(prefers-reduced-motion: reduce)',
})

export const DitherBackground = ({
  className,
  shape = 'warp',
  mask = 'bottom',
  speed = 0.1,
}: {
  className?: string
  shape?: 'warp' | 'ripple'
  mask?: keyof typeof DITHER_MASKS
  speed?: number
}) => {
  const theme = useResolvedTheme()
  const isMounted = useIsMounted()
  const prefersReducedMotion = useSubscription(reducedMotionQuery)
  const colors = DITHER_COLORS[theme]

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0',
        DITHER_MASKS[mask],
        className
      )}
    >
      {isMounted && (
        <Dithering
          colorBack={colors.back}
          colorFront={colors.front}
          shape={shape}
          type="8x8"
          size={4}
          speed={prefersReducedMotion ? 0 : speed}
          style={{ height: '100%', width: '100%' }}
        />
      )}
    </div>
  )
}
