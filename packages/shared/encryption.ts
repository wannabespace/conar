import { hexDecode, hexEncode } from './hex'

function str2ab(str: string) {
  return new TextEncoder().encode(str)
}

function ab2str(buf: ArrayBuffer) {
  return new TextDecoder().decode(buf)
}

export async function encrypt({ text, secret }: { text: string, secret: string }) {
  const pwHash = await crypto.subtle.digest('SHA-256', str2ab(secret))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await crypto.subtle.importKey('raw', pwHash, { name: 'AES-GCM' }, false, ['encrypt'])
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, str2ab(text))

  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('')
  const encryptedBase64 = hexEncode(String.fromCharCode(...new Uint8Array(encrypted)))

  return ivHex + encryptedBase64
}

export async function decrypt({ encryptedText, secret }: { encryptedText: string, secret: string }) {
  const pwHash = await crypto.subtle.digest('SHA-256', str2ab(secret))

  const iv = new Uint8Array(12)
  for (let i = 0; i < 24; i += 2) {
    iv[i / 2] = Number.parseInt(encryptedText.substring(i, i + 2), 16)
  }

  const key = await crypto.subtle.importKey('raw', pwHash, { name: 'AES-GCM' }, false, ['decrypt'])
  const encryptedData = Uint8Array.from(hexDecode(encryptedText.slice(24)), c => c.charCodeAt(0))

  try {
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encryptedData)
    return ab2str(decrypted)
  }
  catch {
    return null
  }
}
