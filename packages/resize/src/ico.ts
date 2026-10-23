const ICO_HEADER_SIZE = 6
const ICO_ENTRY_SIZE = 16

export const toIco = (images: { png: Buffer; size: number }[]) => {
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
