import sharp from 'sharp'

import { toIco } from './ico'
import type { IconFile, Shape } from './types'

export const CANVAS = 1024

const toPng = (icon: Buffer, size: number) =>
  sharp(icon).resize(size, size).png({ compressionLevel: 9 }).toBuffer()

const SQUIRCLE_EXPONENT = 5
const SQUIRCLE_POINTS = 720
const EDGE_WIDTH = 2

const getOutline = (corners: number | 'squircle', inset: number) => {
  const half = CANVAS / 2 - inset
  if (corners !== 'squircle') {
    return `<rect x="${inset}" y="${inset}" width="${2 * half}" height="${2 * half}" rx="${corners * CANVAS}"`
  }
  const points = Array.from({ length: SQUIRCLE_POINTS }, (_, index) => {
    const angle = (2 * Math.PI * index) / SQUIRCLE_POINTS
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const x = Math.sign(cos) * Math.abs(cos) ** (2 / SQUIRCLE_EXPONENT)
    const y = Math.sign(sin) * Math.abs(sin) ** (2 / SQUIRCLE_EXPONENT)
    return `${(CANVAS / 2 + half * x).toFixed(2)},${(CANVAS / 2 + half * y).toFixed(2)}`
  })
  return `<path d="M${points.join('L')}Z"`
}

const toSvg = (element: string) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}">${element}</svg>`
  )

export const renderShape = async (
  source: Buffer,
  sourceMarkSize: number,
  { corners, markSize }: Shape
) => {
  const crop = (CANVAS * sourceMarkSize) / markSize
  const inset = Math.round((CANVAS - crop) / 2)
  const size = CANVAS - 2 * inset
  const zoomed = await sharp(source)
    .extract({ height: size, left: inset, top: inset, width: size })
    .resize(CANVAS, CANVAS)
    .png({ compressionLevel: 9 })
    .toBuffer()
  if (corners === undefined) {
    return zoomed
  }
  return sharp(zoomed)
    .composite([
      { blend: 'dest-in', input: toSvg(`${getOutline(corners, 0)}/>`) },
      {
        input: toSvg(
          `${getOutline(corners, EDGE_WIDTH / 2)} fill="none" stroke="#0A1A40" stroke-opacity="0.10" stroke-width="${EDGE_WIDTH}"/>`
        ),
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer()
}

export const encode = async (icon: Buffer, file: IconFile<string>) => {
  if ('size' in file) {
    return toPng(icon, file.size)
  }
  return toIco(
    await Promise.all(
      file.sizes.map(async (size) => ({ png: await toPng(icon, size), size }))
    )
  )
}
