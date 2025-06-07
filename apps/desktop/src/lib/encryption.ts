export function encrypt(text: string, secret: string) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  return window.electron.encryption.encrypt({
    text,
    secret,
  })
}

export function decrypt(encryptedText: string, secret: string) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  return window.electron.encryption.decrypt({
    encryptedText,
    secret,
  })
}
