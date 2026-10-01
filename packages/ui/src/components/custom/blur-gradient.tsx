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
      blur: `${blur}px`,
      mask: `linear-gradient(rgba(0, 0, 0, 0) ${100 - end - 12.5}%, rgb(0, 0, 0) ${100 - end}%, rgb(0, 0, 0) ${100 - start - 12.5}%, rgba(0, 0, 0, 0) ${100 - start}%)`,
      zIndex: i + 1,
    }
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
    {gradientLayers.map(({ blur, mask, zIndex }) => (
      <div
        key={zIndex}
        style={
          { '--blur': blur, '--mask': mask, '--z': zIndex } as CSSProperties
        }
        className="absolute inset-0 z-(--z) mask-(--mask) backdrop-blur-(--blur)"
      />
    ))}
  </div>
)
