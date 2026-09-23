import { MeshGradient } from '@paper-design/shaders-react'
import { cn } from '@tamery/ui/lib/utils'
import { useSubscription } from 'seitu/react'
import { createMediaQuery } from 'seitu/web'

const MESH_COLORS = ['#002f90', '#006eff', '#9ec6ff', '#0045cb', '#4b94ff']

const reducedMotionQuery = createMediaQuery({
  query: '(prefers-reduced-motion: reduce)',
})

export const MeshBackground = ({ className }: { className?: string }) => {
  const prefersReducedMotion = useSubscription(reducedMotionQuery)

  return (
    <MeshGradient
      aria-hidden
      className={cn('pointer-events-none absolute inset-0', className)}
      colors={MESH_COLORS}
      distortion={0.8}
      swirl={0}
      grainOverlay={0.12}
      speed={prefersReducedMotion ? 0 : 0.2}
      minPixelRatio={1}
      maxPixelCount={1280 * 800}
    />
  )
}
