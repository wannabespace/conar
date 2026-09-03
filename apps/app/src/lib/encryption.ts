import { orpcProxy } from './orpc'

export const encrypt = (text: string, secret: string) => {
  if (window.electron) {
    return window.electron.encryption.encrypt({
      secret,
      text,
    })
  }

  return orpcProxy.encryption.encrypt({
    secret,
    text,
  })
}

export const decrypt = (encryptedText: string, secret: string) => {
  if (window.electron) {
    return window.electron.encryption.decrypt({
      encryptedText,
      secret,
    })
  }

  return orpcProxy.encryption.decrypt({
    encryptedText,
    secret,
  })
}
