import { orpcProxy } from './orpc'

export function encrypt(text: string, secret: string) {
  if (window.electron) {
    return window.electron.encryption.encrypt({
      text,
      secret,
    })
  }

  return orpcProxy.encryption.encrypt.call({
    text,
    secret,
  })
}

export function decrypt(encryptedText: string, secret: string) {
  if (window.electron) {
    return window.electron.encryption.decrypt({
      encryptedText,
      secret,
    })
  }

  return orpcProxy.encryption.decrypt.call({
    encryptedText,
    secret,
  })
}
