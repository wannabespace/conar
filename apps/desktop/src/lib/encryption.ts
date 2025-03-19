export function encrypt(text: string, secret: string) {
  return window.electron.encryption.encrypt({
    text,
    secret,
  })
}

export function decrypt(encryptedText: string, secret: string) {
  return window.electron.encryption.decrypt({
    encryptedText,
    secret,
  })
}
