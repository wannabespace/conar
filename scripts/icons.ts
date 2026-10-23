/* oxlint-disable no-console */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'
import type { Sharp } from 'sharp'

type IcoSize = 16 | 24 | 32 | 48 | 64 | 128 | 256

interface Transform {
  /** `round` cuts the corners with a 22% radius, `squircle` with the macOS continuous curve. */
  corners?: 'round' | 'squircle'
  /** Crops the edges and scales the rest up; `1.2` makes the content 20% larger. */
  zoom?: number
}

type Output = Transform & ({ size: number } | { sizes: readonly IcoSize[] })

interface Files {
  [file: `${string}.ico`]: Transform & {
    sizes: readonly [IcoSize, ...IcoSize[]]
  }
  [file: `${string}.png`]: Transform & { size: number }
}

const ZOOM = 1.23

const favicons = {
  'apple-touch-icon.png': { size: 180 },
  'favicon-96x96.png': { corners: 'round', size: 96 },
  'favicon.ico': { corners: 'round', sizes: [16, 32, 48] },
} satisfies Files

const web = {
  ...favicons,
  'web-app-manifest-192x192.png': { corners: 'round', size: 192 },
  'web-app-manifest-512x512.png': { corners: 'round', size: 512 },
  'web-app-manifest-maskable-192x192.png': { size: 192, zoom: 1.15 },
  'web-app-manifest-maskable-512x512.png': { size: 512, zoom: 1.15 },
} satisfies Files

const kit = {
  ...web,
  'icon-rounded.png': { corners: 'round', size: 1024 },
  'icon-squircle.png': { corners: 'squircle', size: 1024 },
  'icon.png': { size: 1024 },
} satisfies Files

const IMAGES: Record<string, Record<string, Files>> = {
  'brand/cyan.png': {
    'apps/app/public': web,
    'apps/desktop/resources': {
      'icon-1024x1024.png': { corners: 'round', size: 1024 },
    },
    'apps/desktop/resources/macos-icon.icon/Assets': {
      'icon.png': { size: 1024 },
    },
    'apps/docs/public': web,
    'apps/main/public': web,
    'apps/share/public': favicons,
    'brand/cyan': kit,
  },
  'brand/cyan-inverse.png': {
    'apps/app/public': { 'logo.png': { corners: 'round', size: 256 } },
    'apps/main/public': { 'logo.png': { corners: 'round', size: 256 } },
    'brand/cyan-inverse': kit,
  },
  'brand/dark-cyan.png': { 'brand/dark-cyan': kit },
  'brand/dark-white.png': { 'brand/dark-white': kit },
}

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
  { corners, zoom = ZOOM }: Transform
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
  Object.entries(IMAGES).map(async ([image, folders]) => {
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
