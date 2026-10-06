export const bytesToHex = (bytes: Uint8Array) =>
  `0x${bytes.toHex().toUpperCase()}`

export const hexToBytes = (hex: string) => Uint8Array.fromHex(hex.slice(2))

const bytesAsHex = (_key: string, value: unknown) =>
  value instanceof Uint8Array ? bytesToHex(value) : value

export const valueToText = (value: unknown, indent?: number): string => {
  if (value === null || value === undefined) {
    return ''
  }
  if (value instanceof Uint8Array) {
    return bytesToHex(value)
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, bytesAsHex, indent)
  }
  return String(value)
}
