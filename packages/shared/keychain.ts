// Thrown by the desktop main process and matched by message in the renderer: IPC errors arrive as bare messages.
export const KEYCHAIN_LOCKED_ERROR =
  "Tamery couldn't use its keychain item, so saved connections stay locked. Restart Tamery and allow access when your system asks."

export const isKeychainLocked = (error: unknown) =>
  error instanceof Error && error.message === KEYCHAIN_LOCKED_ERROR
