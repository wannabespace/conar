import sharp from 'sharp'

import { toIco } from './ico'
import type { IconFile, Shape } from './types'

export const CANVAS = 1024

const toPng = (icon: Buffer, size: number) =>
  sharp(icon).resize(size, size).png({ compressionLevel: 9 }).toBuffer()

export const renderShape = async (
  source: Buffer,
  sourceMarkSize: number,
  { cornerRadius, markSize }: Shape
) => {
  const crop = (CANVAS * sourceMarkSize) / markSize
  const inset = Math.round((CANVAS - crop) / 2)
  const size = CANVAS - 2 * inset
  const zoomed = await sharp(source)
    .extract({ height: size, left: inset, top: inset, width: size })
    .resize(CANVAS, CANVAS)
    .png({ compressionLevel: 9 })
    .toBuffer()
  if (cornerRadius === undefined) {
    return zoomed
  }
  const radius = cornerRadius * CANVAS
  return sharp(zoomed)
    .composite([
      {
        blend: 'dest-in',
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}"><rect width="${CANVAS}" height="${CANVAS}" rx="${radius}"/></svg>`
        ),
      },
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}"><rect x="1" y="1" width="${CANVAS - 2}" height="${CANVAS - 2}" rx="${radius}" fill="none" stroke="#0A1A40" stroke-opacity="0.10" stroke-width="2"/></svg>`
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
