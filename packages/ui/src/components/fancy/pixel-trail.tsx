'use client'

import { useDimensions } from '@connnect/ui/hooks/use-dimensions'
import { cn } from '@connnect/ui/lib/utils'
import { motion, useAnimationControls } from 'motion/react'

import React, { useCallback, useMemo, useRef } from 'react'
import { v4 as uuid } from 'uuid'

interface PixelTrailProps {
  pixelSize: number // px
  fadeDuration?: number // ms
  delay?: number // ms
  className?: string
  pixelClassName?: string
}

export function PixelTrail({
  pixelSize = 20,
  fadeDuration = 500,
  delay = 0,
  className,
  pixelClassName,
}: PixelTrailProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dimensions = useDimensions(containerRef)
  const trailId = useRef(uuid())

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current)
        return

      const rect = containerRef.current.getBoundingClientRect()
      const x = Math.floor((e.clientX - rect.left) / pixelSize)
      const y = Math.floor((e.clientY - rect.top) / pixelSize)

      const pixelElement = document.getElementById(
        `${trailId.current}-pixel-${x}-${y}`,
      )
      if (pixelElement) {
        // eslint-disable-next-line ts/no-explicit-any
        const animatePixel = (pixelElement as any).__animatePixel
        if (animatePixel)
          animatePixel()
      }
    },
    [pixelSize],
  )

  const columns = useMemo(
    () => Math.ceil(dimensions.width / pixelSize),
    [dimensions.width, pixelSize],
  )
  const rows = useMemo(
    () => Math.ceil(dimensions.height / pixelSize),
    [dimensions.height, pixelSize],
  )

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute inset-0 w-full h-full',
        className,
      )}
      onMouseMove={handleMouseMove}
    >
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <PixelDot
              key={`${colIndex}-${rowIndex}`}
              id={`${trailId.current}-pixel-${colIndex}-${rowIndex}`}
              size={pixelSize}
              fadeDuration={fadeDuration}
              delay={delay}
              className={pixelClassName}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default PixelTrail

interface PixelDotProps {
  id: string
  size: number
  fadeDuration: number
  delay: number
  className?: string
}

function PixelDot({ id, size, fadeDuration, delay, className }: PixelDotProps) {
  const controls = useAnimationControls()

  const animatePixel = useCallback(() => {
    controls.start({
      opacity: [1, 0],
      transition: { duration: fadeDuration / 1000, delay: delay / 1000 },
    })
  }, [])

  // Attach the animatePixel function to the DOM element
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        // eslint-disable-next-line ts/no-explicit-any
        ;(node as any).__animatePixel = animatePixel
      }
    },
    [animatePixel],
  )

  return (
    <motion.div
      id={id}
      ref={ref}
      className={cn('pointer-events-none', className)}
      style={{
        minWidth: `${size}px`,
        height: `${size}px`,
      }}
      initial={{ opacity: 0 }}
      animate={controls}
      exit={{ opacity: 0 }}
    />
  )
}

PixelDot.displayName = 'PixelDot'
