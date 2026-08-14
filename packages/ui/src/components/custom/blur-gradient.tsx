import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps, CSSProperties } from 'react'

const generateGradientLayers = () => {
  const baseBlur = 0.05
  const multiplier = 2

  return Array.from({ length: 8 }, (_, i) => {
    const start = i * 12.5
    const end = start + 25
    const blur = baseBlur * multiplier ** i

    return {
      backdropFilter: `blur(${blur}px)`,
      maskImage: `linear-gradient(rgba(0, 0, 0, 0) ${100 - end - 12.5}%, rgb(0, 0, 0) ${100 - end}%, rgb(0, 0, 0) ${100 - start - 12.5}%, rgba(0, 0, 0, 0) ${100 - start}%)`,
      zIndex: i + 1,
    } satisfies CSSProperties
  })
}

const gradientLayers = generateGradientLayers()

export const BlurGradient = ({
  className,
  ...props
}: ComponentProps<'div'>) => (
  <div
    className={cn('pointer-events-none overflow-hidden', className)}
    {...props}
  >
    {gradientLayers.map((style) => (
      <div key={style.zIndex} style={style} className="absolute inset-0" />
    ))}
  </div>
)
