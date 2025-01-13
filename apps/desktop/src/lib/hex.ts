export function hexEncode(str: string): string {
  return Array.from(str)
    .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
}

export function hexDecode(hex: string): string {
  return hex.match(/.{1,2}/g)?.map(byte => String.fromCharCode(Number.parseInt(byte, 16))).join('') || ''
}
