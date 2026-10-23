import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'
import type { Sharp } from 'sharp'

import config from '../icons.config'
import type { Output, Transform } from '../icons.config'

const SQUIRCLE_EXPONENT = 5
const SQUIRCLE_POINTS = 720
const ROUND_RADIUS = 0.22
const ICO_HEADER_SIZE = 6
const ICO_ENTRY_SIZE = 16

const rootDir = path.join(import.meta.dirname, '..')

interface Source {
  file: string
  height: number
  width: number
}

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

const resize = (
  { file, height, width }: Source,
  size: number,
  { corners, zoom = config.zoom }: Transform
): Sharp => {
  const crop = Math.round(Math.min(width, height) / zoom)
  const image = sharp(file)
    .extract({
      height: crop,
      left: Math.round((width - crop) / 2),
      top: Math.round((height - crop) / 2),
      width: crop,
    })
    .resize(size, size)
  if (!corners) {
    return image
  }
  return image.composite([
    {
      blend: 'dest-in',
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${getOutline(corners, size)}</svg>`
      ),
    },
  ])
}

const toPng = (image: Sharp) => image.png({ compressionLevel: 9 }).toBuffer()

const toIco = (images: { png: Buffer; size: number }[]) => {
  const header = Buffer.alloc(ICO_HEADER_SIZE + ICO_ENTRY_SIZE * images.length)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = header.length
  for (const [index, { png, size }] of images.entries()) {
    const entry = ICO_HEADER_SIZE + ICO_ENTRY_SIZE * index
    // ICO stores a 256 px dimension as 0; one byte cannot hold 256.
    const dimension = size === 256 ? 0 : size
    header.writeUInt8(dimension, entry)
    header.writeUInt8(dimension, entry + 1)
    header.writeUInt16LE(1, entry + 4)
    header.writeUInt16LE(32, entry + 6)
    header.writeUInt32LE(png.length, entry + 8)
    header.writeUInt32LE(offset, entry + 12)
    offset += png.length
  }
  return Buffer.concat([header, ...images.map(({ png }) => png)])
}

const encode = async (source: Source, output: Output) =>
  'sizes' in output
    ? toIco(
        await Promise.all(
          output.sizes.map(async (size) => ({
            png: await toPng(resize(source, size, output)),
            size,
          }))
        )
      )
    : toPng(resize(source, output.size, output))

const outputsByImage = await Promise.all(
  Object.entries(config.images).map(async ([image, folders]) => {
    const file = path.join(rootDir, image)
    const { height, width } = await sharp(file).metadata()
    return Object.entries(folders).flatMap(([folder, files]) =>
      Object.entries(files).map(([name, output]: [string, Output]) => ({
        file: path.join(folder, name),
        output,
        source: { file, height, width },
      }))
    )
  })
)
const outputs = outputsByImage.flat()

const listed = new Set<string>()
for (const { file } of outputs) {
  if (listed.has(file)) {
    throw new Error(`${file} is listed more than once`)
  }
  listed.add(file)
}

await Promise.all(
  outputs.map(async ({ file, output, source }) => {
    const buffer = await encode(source, output)
    await mkdir(path.dirname(path.join(rootDir, file)), { recursive: true })
    await writeFile(path.join(rootDir, file), buffer)
    console.log(file)
  })
)
