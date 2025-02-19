import type { ReactNode, Ref } from 'react'
import { useMeasure } from '@react-hookz/web'
import { createElement, useMemo } from 'react'

const iOSPreset = {
  r1: 0.0586,
  r2: 0.332,
}

function getSquirclePath(w: number, h: number, r1: number, r2: number) {
  const newR1 = Math.min(r1, r2)

  return `
    M 0,${r2}
    C 0,${newR1} ${newR1},0 ${r2},0
    L ${w - r2},0
    C ${w - newR1},0 ${w},${newR1} ${w},${r2}
    L ${w},${h - r2}
    C ${w},${h - newR1} ${w - newR1},${h} ${w - r2},${h}
    L ${r2},${h}
    C ${newR1},${h} 0,${h - newR1} 0,${h - r2}
    L 0,${r2}
  `
    .trim()
    .replace(/\n/g, ' ')
}

function getSquirclePathAsDataUri(w: number, h: number, r1: number, r2: number) {
  const id = `squircle-${w}-${h}-${r1}-${r2}`
  const path = getSquirclePath(w, h, r1, r2)

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs>
        <clipPath id="${id}"><path fill="#000" d="${path}"/></clipPath>
      </defs>
      <g clip-path="url(#${id})">
        <rect width="${w}" height="${h}" fill="#000"/>
      </g>
    </svg>
  `
    .trim()
    .replace(/\n| {2,}/g, '')

  return convertSvgToDataUri(svg)
}

function convertSvgToDataUri(data: string) {
  return `data:image/svg+xml,${data
    .replace(/"/g, '\'')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\r\n%#()<>?[\\\]^`{|}]/g, encodeURIComponent)}`
}

export function SmoothCorner({
  tag = 'div',
  children,
  className,
  radius,
  roundness = iOSPreset.r1 / iOSPreset.r2,
  onClick,
  ref,
}: {
  tag?: string
  children: ReactNode
  className?: string
  radius: number
  roundness?: number
  onClick?: () => void
  ref?: Ref<HTMLElement | null>
}) {
  const [size, elementRef] = useMeasure<HTMLElement>()
  const options = useMemo(() => {
    const smoothRadius = +(radius * 1.5).toFixed()

    return {
      width: +(size?.width ?? 0).toFixed(),
      height: +(size?.height ?? 0).toFixed(),
      roundness: +(smoothRadius * roundness).toFixed(),
      radius: smoothRadius,
    }
  }, [size, radius, roundness])
  const id = useMemo(() => [options.width, options.height, options.radius, options.roundness].join('-'), [options.width, options.height, options.radius, options.roundness])
  const canRender = useMemo(() => size?.width && size.width >= 30 && size?.height && size.height >= 30, [size?.width, size?.height])

  const path = useMemo(() => canRender
    ? getSquirclePathAsDataUri(
        options.width,
        options.height,
        options.roundness,
        options.radius,
      )
    : null, [canRender, id, options])

  const style = useMemo(() =>
    path ? { maskImage: `url("${path}")` } : { borderRadius: `${radius.toFixed()}px` }, [path, radius])

  return createElement(tag, {
    ref: (e: HTMLElement) => {
      elementRef.current = e
      if (typeof ref === 'function')
        ref(e)
      else if (ref)
        ref.current = e
    },
    className,
    style,
    ...(tag === 'button' && { type: 'button', onClick }),
  }, children)
}
