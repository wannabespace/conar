/* oxlint-disable no-console */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import sharp from 'sharp'

import { iconsConfig } from './config'
import type { IconFormat, IconShape } from './types'

const ROOT = path.join(import.meta.dirname, '../..')
const CANVAS = 1024
const ICO_HEADER_SIZE = 6
const ICO_ENTRY_SIZE = 16

const { outputs, shapes, sourceMarkWidth, sourcePrefix, sources } = iconsConfig

const sourceDir = process.argv.at(2) ?? null
const sourceFiles = sourceDir ? await readdir(sourceDir) : []

const readSource = (name: string, savedFile: string) => {
  const prefix = `${sourcePrefix}${name}-`
  const largest = sourceFiles
    .filter((file) => file.startsWith(prefix) && path.extname(file) === '.png')
    .map((file) => ({
      file,
      size: Number(path.parse(file).name.slice(prefix.length)),
    }))
    .filter(({ size }) => Number.isInteger(size))
    .toSorted((a, b) => b.size - a.size)
    .at(0)
  if (!sourceDir || !largest) {
    return readFile(path.join(ROOT, savedFile))
  }
  return sharp(path.join(sourceDir, largest.file))
    .resize(CANVAS, CANVAS)
    .png({ compressionLevel: 9 })
    .toBuffer()
}

const renderShape = async (
  source: Buffer,
  { cornerRadius, markWidth }: IconShape
) => {
  const crop = (CANVAS * sourceMarkWidth) / markWidth
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
  return sharp(zoomed)
    .composite([
      {
        blend: 'dest-in',
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}"><rect width="${CANVAS}" height="${CANVAS}" rx="${cornerRadius}"/></svg>`
        ),
      },
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}"><rect x="1" y="1" width="${CANVAS - 2}" height="${CANVAS - 2}" rx="${cornerRadius}" fill="none" stroke="#0A1A40" stroke-opacity="0.10" stroke-width="2"/></svg>`
        ),
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer()
}

const toPng = (icon: Buffer, size: number) =>
  sharp(icon).resize(size, size).png({ compressionLevel: 9 }).toBuffer()

const toIco = async (icon: Buffer, sizes: number[]) => {
  const images = await Promise.all(
    sizes.map(async (size) => ({ png: await toPng(icon, size), size }))
  )
  const header = Buffer.alloc(ICO_HEADER_SIZE + ICO_ENTRY_SIZE * images.length)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = header.length
  for (const [index, { png, size }] of images.entries()) {
    const entry = ICO_HEADER_SIZE + ICO_ENTRY_SIZE * index
    header.writeUInt8(size, entry)
    header.writeUInt8(size, entry + 1)
    header.writeUInt16LE(1, entry + 4)
    header.writeUInt16LE(32, entry + 6)
    header.writeUInt32LE(png.length, entry + 8)
    header.writeUInt32LE(offset, entry + 12)
    offset += png.length
  }
  return Buffer.concat([header, ...images.map(({ png }) => png)])
}

const encode = (icon: Buffer, format: IconFormat) =>
  format.type === 'ico' ? toIco(icon, format.sizes) : toPng(icon, format.size)

const renders = new Map<string, Promise<Buffer>>()
const once = (key: string, render: () => Promise<Buffer>) => {
  const pending = renders.get(key) ?? render()
  renders.set(key, pending)
  return pending
}

const loadSource = (name: string, file: string) =>
  once(name, () => readSource(name, file))

const files = [
  ...Object.entries(sources).map(async ([name, file]) => ({
    buffer: await loadSource(name, file),
    file,
  })),
  ...outputs.map(async ({ file, format, shape, source }) => {
    const shaped = await once(`${source}:${shape}`, async () =>
      renderShape(await loadSource(source, sources[source]), shapes[shape])
    )
    return { buffer: await encode(shaped, format), file }
  }),
]

const written = await Promise.all(
  files.map(async (pending) => {
    const { buffer, file } = await pending
    await mkdir(path.dirname(path.join(ROOT, file)), { recursive: true })
    await writeFile(path.join(ROOT, file), buffer)
    return file
  })
)
console.log(written.join('\n'))
