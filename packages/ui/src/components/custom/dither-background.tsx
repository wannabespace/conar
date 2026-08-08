import { Dithering } from '@paper-design/shaders-react'
import { useIsMounted } from '@tamery/ui/hookas/use-is-mounted'
import { useMediaQuery } from '@tamery/ui/hookas/use-media-query'
import { cn } from '@tamery/ui/lib/utils'

import { useResolvedTheme } from '../../theme-store'

const DITHER_COLORS = {
  light: { back: '#f3f3f5', front: '#c2c3c4' },
  dark: { back: '#16181c', front: '#454649' },
}

export function DitherBackground({
  className,
  shape = 'warp',
}: {
  className?: string
  shape?: 'warp' | 'ripple'
}) {
  const theme = useResolvedTheme()
  const isMounted = useIsMounted()
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const colors = DITHER_COLORS[theme]

  return (
    <div
      aria-hidden
      className={cn(
        `
          pointer-events-none absolute inset-0
          mask-[linear-gradient(to_bottom,#000_70%,transparent_100%)]
        `,
        className,
      )}
    >
      {isMounted && (
        <Dithering
          colorBack={colors.back}
          colorFront={colors.front}
          shape={shape}
          type="8x8"
          size={4}
          speed={prefersReducedMotion ? 0 : 0.1}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  )
}
