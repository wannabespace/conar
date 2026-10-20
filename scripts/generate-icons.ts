/* oxlint-disable no-console */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import sharp from 'sharp'

const ROOT = path.join(import.meta.dirname, '..')
const GLYPH = 'apps/desktop/resources/macos-icon.icon/Assets/glyph.png'
const CANVAS = 1024
const MARK_SIZE = 754
const MARK_PADDING = (CANVAS - MARK_SIZE) / 2
const MASKABLE_MARK_SCALE = 0.93
const ICO_SIZES = [16, 32, 48]
const ICO_HEADER_SIZE = 6
const ICO_ENTRY_SIZE = 16
const TRANSPARENT = { alpha: 0, b: 0, g: 0, r: 0 }

const fitMark = async (source: string) => {
  const { isOpaque } = await sharp(source).stats()
  if (isOpaque) {
    throw new Error(
      'The source must be the mark alone on a transparent background'
    )
  }
  return sharp(source)
    .trim()
    .resize(MARK_SIZE, MARK_SIZE, { background: TRANSPARENT, fit: 'contain' })
    .extend({
      background: TRANSPARENT,
      bottom: MARK_PADDING,
      left: MARK_PADDING,
      right: MARK_PADDING,
      top: MARK_PADDING,
    })
    .png({ compressionLevel: 9 })
    .toBuffer()
}

const source = process.argv.at(2)
const glyph = source
  ? await fitMark(source)
  : await readFile(path.join(ROOT, GLYPH))

const renderIcon = ({
  markScale,
  rounded,
}: {
  markScale: number
  rounded: boolean
}) => {
  const plate = rounded
    ? '<rect x="1" y="1" width="1022" height="1022" rx="227" fill="url(#plate)" stroke="#0A1A40" stroke-opacity="0.10" stroke-width="2"/>'
    : '<rect width="1024" height="1024" fill="url(#plate)"/>'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}">
  <defs>
    <image id="mark" width="${CANVAS}" height="${CANVAS}" href="data:image/png;base64,${glyph.toString('base64')}"/>
    <linearGradient id="plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#ECEEF8"/></linearGradient>
    <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <filter id="white"><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/></filter>
    <filter id="black"><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="28"/></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="3"/></filter>
    <mask id="silhouette"><use href="#mark" filter="url(#white)"/></mask>
    <mask id="rim"><use href="#mark" filter="url(#white)"/><use href="#mark" y="17.1" filter="url(#black)"/></mask>
  </defs>
  ${plate}
  <g transform="translate(512 512) scale(${markScale}) translate(-512 -512)">
    <g filter="url(#glow)" opacity="0.45" transform="translate(0 31.8)"><use href="#mark"/></g>
    <use href="#mark"/>
    <rect width="1024" height="1024" fill="url(#gloss)" mask="url(#silhouette)"/>
    <g filter="url(#soft)"><rect width="1024" height="1024" fill="#fff" opacity="0.7" mask="url(#rim)"/></g>
  </g>
</svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

const tile = await renderIcon({ markScale: 1, rounded: true })
const fullBleed = await renderIcon({ markScale: 1, rounded: false })
const maskable = await renderIcon({
  markScale: MASKABLE_MARK_SCALE,
  rounded: false,
})

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

const webIcons = {
  'apple-touch-icon.png': await toPng(fullBleed, 180),
  'favicon-96x96.png': await toPng(tile, 96),
  'favicon.ico': await toIco(tile),
  'web-app-manifest-192x192.png': await toPng(tile, 192),
  'web-app-manifest-512x512.png': await toPng(tile, 512),
  'web-app-manifest-maskable-192x192.png': await toPng(maskable, 192),
  'web-app-manifest-maskable-512x512.png': await toPng(maskable, 512),
}

const files: Record<string, Buffer> = {
  [GLYPH]: glyph,
  'apps/desktop/resources/icon-1024x1024.png': await toPng(tile, 1024),
  'apps/desktop/resources/tray-icon.png': await toPng(tile, 32),
  'apps/main/public/logo.png': await toPng(tile, 512),
  'docs/favicon.png': await toPng(tile, 96),
}
for (const folder of ['apps/app/public', 'apps/main/public']) {
  for (const [name, buffer] of Object.entries(webIcons)) {
    files[path.join(folder, name)] = buffer
  }
}

await Promise.all(
  Object.entries(files).map(([file, buffer]) =>
    writeFile(path.join(ROOT, file), buffer)
  )
)
console.log(Object.keys(files).join('\n'))
