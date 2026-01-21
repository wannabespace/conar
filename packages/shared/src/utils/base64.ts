export function getBase64FromFiles(files: File[]): Promise<string[]> {
  return Promise.all(files.map(getBase64))
}

function getBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = event => resolve(event.target?.result as string)
    reader.onerror = error => reject(error)

    reader.readAsDataURL(file)
  })
}

export function toBase64(str: string) {
  const bytes = new TextEncoder().encode(str)
  const binString = String.fromCodePoint(...bytes)
  return btoa(binString)
}

export function fromBase64(base64: string) {
  const binString = atob(base64)
  const bytes = Uint8Array.from(binString, m => m.codePointAt(0)!)
  return new TextDecoder().decode(bytes)
}

export function b64UrlEncode(buf: Uint8Array) {
  return toBase64(String.fromCharCode(...buf))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
