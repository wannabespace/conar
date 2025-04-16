'use client'

import { useDebouncedMemo } from '@connnect/ui/hookas/use-debounced-memo'
import { useElementSize } from '@connnect/ui/hookas/use-element-size'
import { cn } from '@connnect/ui/lib/utils'
import React, { useId, useRef } from 'react'

/**
 *  DotPattern Component Props
 *
 * @param {number} [width=16] - The horizontal spacing between dots
 * @param {number} [height=16] - The vertical spacing between dots
 * @param {number} [x=0] - The x-offset of the entire pattern
 * @param {number} [y=0] - The y-offset of the entire pattern
 * @param {number} [cx=1] - The x-offset of individual dots
 * @param {number} [cy=1] - The y-offset of individual dots
 * @param {number} [cr=1] - The radius of each dot
 * @param {string} [className] - Additional CSS classes to apply to the SVG container
 * @param {boolean} [glow=false] - Whether dots should have a glowing animation effect
 */
interface DotPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number
  height?: number
  x?: number
  y?: number
  cx?: number
  cy?: number
  cr?: number
  className?: string
  glow?: boolean
  [key: string]: unknown
}

/**
 * DotPattern Component
 *
 * A React component that creates an animated or static dot pattern background using SVG.
 * The pattern automatically adjusts to fill its container and can optionally display glowing dots.
 *
 * @component
 *
 * @see DotPatternProps for the props interface.
 *
 * @example
 * // Basic usage
 * <DotPattern />
 *
 * // With glowing effect and custom spacing
 * <DotPattern
 *   width={20}
 *   height={20}
 *   glow={true}
 *   className="opacity-50"
 * />
 *
 * @notes
 * - The component is client-side only ("use client")
 * - Automatically responds to container size changes
 * - When glow is enabled, dots will animate with random delays and durations
 * - Uses Motion for animations
 * - Dots color can be controlled via the text color utility classes
 */

export function DotPattern({
  width = 16,
  height = 16,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  ...props
}: DotPatternProps) {
  const id = useId()
  const containerRef = useRef<SVGSVGElement>(null)
  const dimensions = useElementSize(containerRef, {
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    height: typeof window === 'undefined' ? 0 : window.innerHeight,
  })
  const dots = useDebouncedMemo(() => Array.from(
    {
      length:
        Math.ceil(dimensions.width / width)
        * Math.ceil(dimensions.height / height),
    },
    (_, i) => {
      const col = i % Math.ceil(dimensions.width / width)
      const row = Math.floor(i / Math.ceil(dimensions.width / width))
      return {
        x: col * width + cx,
        y: row * height + cy,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2,
      }
    },
  ), [dimensions.height, dimensions.width], 100)

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full',
        className,
      )}
      {...props}
    >
      <defs>
        <radialGradient id={`${id}-gradient`}>
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      {dots.map(dot => (
        <circle
          key={`${dot.x}-${dot.y}`}
          cx={dot.x}
          cy={dot.y}
          r={cr}
          fill="currentColor"
          className="text-neutral-400/80"
        />
      ))}
    </svg>
  )
}
