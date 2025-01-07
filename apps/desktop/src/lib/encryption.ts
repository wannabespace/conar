function hexEncode(str: string): string {
  return Array.from(str)
    .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
}

function hexDecode(hex: string): string {
  return hex.match(/.{1,2}/g)?.map(byte => String.fromCharCode(Number.parseInt(byte, 16))).join('') || ''
}

function generateSalt(length: number = 16) {
  return crypto.getRandomValues(new Uint8Array(length))
}

function str2ab(str: string) {
  const buf = new ArrayBuffer(str.length)
  const bufView = new Uint8Array(buf)
  for (let i = 0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}

function ab2str(buf: ArrayBuffer) {
  return String.fromCharCode.apply(null, Array.from(new Uint8Array(buf)))
}

async function getKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations: number = 100000,
): Promise<CryptoKey> {
  const passwordBuffer = str2ab(password)

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey'],
  )

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encrypt({ text, secret }: { text: string, secret: string }) {
  const salt = generateSalt()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await getKeyFromPassword(secret, salt)

  const encodedData = new TextEncoder().encode(text)
  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encodedData,
  )

  const encryptedContentArray = new Uint8Array(encryptedContent)
  const resultArray = new Uint8Array(salt.length + iv.length + encryptedContentArray.length)

  resultArray.set(salt)
  resultArray.set(iv, salt.length)
  resultArray.set(encryptedContentArray, salt.length + iv.length)

  return hexEncode(ab2str(resultArray.buffer))
}

export async function decrypt({ encryptedText, secret }: { encryptedText: string, secret: string }) {
  const encryptedArray = new Uint8Array(str2ab(hexDecode(encryptedText)))
  const salt = encryptedArray.slice(0, 16)
  const iv = encryptedArray.slice(16, 28)
  const encryptedContent = encryptedArray.slice(28)

  const key = await getKeyFromPassword(secret, salt)

  const decryptedContent = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encryptedContent,
  )

  return new TextDecoder().decode(decryptedContent)
}
