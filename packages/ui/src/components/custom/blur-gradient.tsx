import type { ComponentProps, CSSProperties } from 'react'
import { cn } from '@conar/ui/lib/utils'

function generateGradientLayers() {
  const baseBlur = 0.05
  const multiplier = 2

  return Array.from({ length: 8 }, (_, i) => {
    const start = i * 12.5
    const end = start + 25
    const blur = baseBlur * multiplier ** i

    return {
      zIndex: i + 1,
      maskImage: `linear-gradient(rgba(0, 0, 0, 0) ${100 - end - 12.5}%, rgb(0, 0, 0) ${100 - end}%, rgb(0, 0, 0) ${100 - start - 12.5}%, rgba(0, 0, 0, 0) ${100 - start}%)`,
      backdropFilter: `blur(${blur}px)`,
    } satisfies CSSProperties
  })
}

const gradientLayers = generateGradientLayers()

export function BlurGradient({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('overflow-hidden pointer-events-none', className)} {...props}>
      {gradientLayers.map((style, index) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          style={style}
          className="absolute inset-0"
        />
      ))}
    </div>
  )
}
