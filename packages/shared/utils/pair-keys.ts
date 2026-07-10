import { base64ToBytes, bytesToBase64 } from './base64'
import { decryptWithKey, encryptWithKey } from './crypto-web'

const EC_PARAMS = { name: 'ECDH', namedCurve: 'P-256' } as const
const AES_PARAMS = { name: 'AES-GCM', length: 256 } as const

function deriveAesKey(privateKey: CryptoKey, publicKey: CryptoKey, usage: 'encrypt' | 'decrypt') {
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    AES_PARAMS,
    false,
    [usage],
  )
}

export async function generateEncryptionKeyPair() {
  const keyPair = await crypto.subtle.generateKey(EC_PARAMS, true, ['deriveKey'])
  const [publicKey, privateKey] = await Promise.all([
    crypto.subtle.exportKey('raw', keyPair.publicKey),
    crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
  ])

  return {
    publicKey: bytesToBase64(new Uint8Array(publicKey)),
    privateKey: bytesToBase64(new Uint8Array(privateKey)),
  }
}

export async function encryptWithPublicKey({ text, publicKey }: { text: string, publicKey: string }) {
  const recipientPublicKey = await crypto.subtle.importKey('raw', base64ToBytes(publicKey), EC_PARAMS, false, [])
  const ephemeralKeyPair = await crypto.subtle.generateKey(EC_PARAMS, true, ['deriveKey'])

  const aesKey = await deriveAesKey(ephemeralKeyPair.privateKey, recipientPublicKey, 'encrypt')
  const data = await encryptWithKey(aesKey, text)
  const ephemeralPublicKey = await crypto.subtle.exportKey('raw', ephemeralKeyPair.publicKey)

  return `${bytesToBase64(new Uint8Array(ephemeralPublicKey))}.${data}`
}

export async function decryptWithPrivateKey(privateKey: string, encryptedText: string) {
  const [ephemeralPublicKey, data] = encryptedText.split('.')

  if (!ephemeralPublicKey || !data) {
    throw new Error('Failed to decrypt text')
  }

  const importedPrivateKey = await crypto.subtle.importKey('pkcs8', base64ToBytes(privateKey), EC_PARAMS, false, ['deriveKey'])
  const importedEphemeralPublicKey = await crypto.subtle.importKey('raw', base64ToBytes(ephemeralPublicKey), EC_PARAMS, false, [])

  const aesKey = await deriveAesKey(importedPrivateKey, importedEphemeralPublicKey, 'decrypt')

  return decryptWithKey(aesKey, data)
}
