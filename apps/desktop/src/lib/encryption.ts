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

export async function encrypt({ data, secret }: { data: string, secret: string }) {
  const salt = generateSalt()
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const key = await getKeyFromPassword(secret, salt)

  const encodedData = new TextEncoder().encode(data)
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
  resultArray.set(salt) // First 16 bytes are salt
  resultArray.set(iv, salt.length) // Next 12 bytes are IV
  resultArray.set(encryptedContentArray, salt.length + iv.length) // Rest is encrypted content

  return btoa(ab2str(resultArray.buffer))
}

export async function decrypt({ encryptedText, secret }: { encryptedText: string, secret: string }) {
  const encryptedArray = new Uint8Array(str2ab(atob(encryptedText)))
  const salt = encryptedArray.slice(0, 16) // First 16 bytes are salt
  const iv = encryptedArray.slice(16, 28) // Next 12 bytes are IV
  const encryptedContent = encryptedArray.slice(28) // Rest is encrypted content

  // Get decryption key using the same salt
  const key = await getKeyFromPassword(secret, salt)

  // Decrypt the content
  const decryptedContent = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encryptedContent,
  )

  // Convert back to string
  return new TextDecoder().decode(decryptedContent)
}
