/* oxlint-disable no-console */
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import sharp from 'sharp'

const ROOT = path.join(import.meta.dirname, '..')
const BRAND = 'brand'
const VARIANTS = ['cyan', 'dark-cyan', 'dark-white']
const APP_VARIANT = 'cyan'
const SOURCE_PREFIX = 'tamery-avatar-'
const CANVAS = 1024
const ICO_SIZES = [16, 32, 48]
const ICO_HEADER_SIZE = 6
const ICO_ENTRY_SIZE = 16

const sourceDir = process.argv.at(2) ?? null
const sourceFiles = sourceDir ? await readdir(sourceDir) : []

const readSource = (variant: string) => {
  const prefix = `${SOURCE_PREFIX}${variant}-`
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
    return readFile(path.join(ROOT, BRAND, variant, 'icon.png'))
  }
  return sharp(path.join(sourceDir, largest.file))
    .resize(CANVAS, CANVAS)
    .png({ compressionLevel: 9 })
    .toBuffer()
}

const toPng = (icon: Buffer, size: number) =>
  sharp(icon).resize(size, size).png({ compressionLevel: 9 }).toBuffer()

const toIco = async (icon: Buffer) => {
  const images = await Promise.all(
    ICO_SIZES.map(async (size) => ({ png: await toPng(icon, size), size }))
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

const getIcons = async (fullBleed: Buffer) => {
  const roundedTile = await sharp(fullBleed)
    .composite([
      {
        blend: 'dest-in',
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}"><rect width="${CANVAS}" height="${CANVAS}" rx="227"/></svg>`
        ),
      },
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}"><rect x="1" y="1" width="1022" height="1022" rx="227" fill="none" stroke="#0A1A40" stroke-opacity="0.10" stroke-width="2"/></svg>`
        ),
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer()
  return {
    desktop: {
      'icon-rounded.png': roundedTile,
      'icon.png': fullBleed,
      'logo.png': await toPng(roundedTile, 512),
    },
    web: {
      'apple-touch-icon.png': await toPng(fullBleed, 180),
      'favicon-96x96.png': await toPng(roundedTile, 96),
      'favicon.ico': await toIco(roundedTile),
      'web-app-manifest-192x192.png': await toPng(roundedTile, 192),
      'web-app-manifest-512x512.png': await toPng(roundedTile, 512),
      'web-app-manifest-maskable-192x192.png': await toPng(fullBleed, 192),
      'web-app-manifest-maskable-512x512.png': await toPng(fullBleed, 512),
    },
  }
}

const iconSets = await Promise.all(
  VARIANTS.map(async (variant) => ({
    variant,
    ...(await getIcons(await readSource(variant))),
  }))
)

const files: Record<string, Buffer> = {}
for (const { desktop, variant, web } of iconSets) {
  for (const [name, buffer] of Object.entries({ ...desktop, ...web })) {
    files[path.join(BRAND, variant, name)] = buffer
  }
  if (variant !== APP_VARIANT) {
    continue
  }
  files['apps/desktop/resources/macos-icon.icon/Assets/icon.png'] =
    desktop['icon.png']
  files['apps/desktop/resources/icon-1024x1024.png'] =
    desktop['icon-rounded.png']
  files['apps/main/public/logo.png'] = desktop['logo.png']
  for (const folder of [
    'apps/app/public',
    'apps/docs/public',
    'apps/main/public',
    'apps/share/public',
  ]) {
    for (const [name, buffer] of Object.entries(web)) {
      files[path.join(folder, name)] = buffer
    }
  }
}

await Promise.all(
  Object.entries(files).map(async ([file, buffer]) => {
    await mkdir(path.dirname(path.join(ROOT, file)), { recursive: true })
    await writeFile(path.join(ROOT, file), buffer)
  })
)
console.log(Object.keys(files).join('\n'))
