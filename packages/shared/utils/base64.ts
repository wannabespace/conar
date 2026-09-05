export const toBase64 = (str: string) => {
  const bytes = new TextEncoder().encode(str)
  const binString = String.fromCodePoint(...bytes)
  return btoa(binString)
}

const toCodePoint = (char: string) => {
  const code = char.codePointAt(0)
  if (code === undefined) {
    throw new Error('Invalid base64 character')
  }
  return code
}

export const fromBase64 = (base64: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(base64), toCodePoint))

export const bytesToBase64 = (bytes: Uint8Array) =>
  btoa(String.fromCodePoint(...bytes))

export const base64ToBytes = (base64: string) =>
  Uint8Array.from(atob(base64), toCodePoint)

export const b64UrlEncode = (buf: Uint8Array) =>
  toBase64(String.fromCodePoint(...buf))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '')
