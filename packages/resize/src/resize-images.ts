import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'
import type { Sharp } from 'sharp'

import { toIco } from './ico'
import type { Output, ResizeConfig } from './types'

const SQUIRCLE_EXPONENT = 5
const SQUIRCLE_POINTS = 720
const ROUND_RADIUS = 0.22

const getOutline = (corners: 'round' | 'squircle', size: number) => {
  if (corners === 'round') {
    return `<rect width="${size}" height="${size}" rx="${ROUND_RADIUS * size}"/>`
  }
  const half = size / 2
  const points = Array.from({ length: SQUIRCLE_POINTS }, (_, index) => {
    const angle = (2 * Math.PI * index) / SQUIRCLE_POINTS
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const x = Math.sign(cos) * Math.abs(cos) ** (2 / SQUIRCLE_EXPONENT)
    const y = Math.sign(sin) * Math.abs(sin) ** (2 / SQUIRCLE_EXPONENT)
    return `${(half + half * x).toFixed(2)},${(half + half * y).toFixed(2)}`
  })
  return `<path d="M${points.join('L')}Z"/>`
}

const resize = async (
  source: string,
  size: number,
  { corners, zoom }: { corners?: Output['corners']; zoom: number }
) => {
  const { height = 0, width = 0 } = await sharp(source).metadata()
  const crop = Math.round(Math.min(width, height) / zoom)
  const zoomed = sharp(source)
    .extract({
      height: crop,
      left: Math.round((width - crop) / 2),
      top: Math.round((height - crop) / 2),
      width: crop,
    })
    .resize(size, size)
  if (!corners) {
    return zoomed
  }
  return sharp(await zoomed.png().toBuffer()).composite([
    {
      blend: 'dest-in',
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${getOutline(corners, size)}</svg>`
      ),
    },
  ])
}

const toPng = (image: Sharp) => image.png({ compressionLevel: 9 })

const ENCODERS: Record<string, (image: Sharp) => Sharp> = {
  '.jpg': (image) => image.jpeg(),
  '.png': toPng,
  '.webp': (image) => image.webp(),
}

const encode = async (
  source: string,
  file: string,
  output: Output & { zoom: number }
) => {
  if ('sizes' in output) {
    return toIco(
      await Promise.all(
        output.sizes.map(async (size) => {
          const image = await resize(source, size, output)
          return { png: await toPng(image).toBuffer(), size }
        })
      )
    )
  }
  const encoder = ENCODERS[path.extname(file)]
  if (!encoder) {
    throw new Error(`${file}: unsupported format`)
  }
  return encoder(await resize(source, output.size, output)).toBuffer()
}

const isOutput = (value: Output | Record<string, Output>): value is Output =>
  'size' in value || 'sizes' in value

export const resizeImages = (
  { images, zoom = 1 }: ResizeConfig,
  root: string
) => {
  const outputs = Object.entries(images).flatMap(([image, targets]) =>
    Object.entries(targets).flatMap(([target, value]) =>
      isOutput(value)
        ? [{ file: target, image, output: value }]
        : Object.entries(value).map(([file, output]) => ({
            file: path.join(target, file),
            image,
            output,
          }))
    )
  )

  const repeated = outputs.find(
    ({ file }, index) =>
      outputs.findIndex((other) => other.file === file) !== index
  )
  if (repeated) {
    throw new Error(`${repeated.file} is listed more than once`)
  }

  return Promise.all(
    outputs.map(async ({ file, image, output }) => {
      const buffer = await encode(path.join(root, image), file, {
        zoom,
        ...output,
      })
      await mkdir(path.dirname(path.join(root, file)), { recursive: true })
      await writeFile(path.join(root, file), buffer)
      return file
    })
  )
}
