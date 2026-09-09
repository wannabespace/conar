export interface AppVariables {
  isAppOutdated: boolean
  parsedAppVersion: {
    major: number
    minor: number
    patch: number
  } | null
  logEvent?: Record<string, unknown>
}
