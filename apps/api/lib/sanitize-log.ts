import { DeepRedact } from '@hackylabs/deep-redact/index.ts'

const redactor = new DeepRedact({
  blacklistedKeys: [
    /password/i,
    /passwd/i,
    /secret/i,
    /token/i,
    /api[-_]?key/i,
    /authorization/i,
    /cookie/i,
    /session/i,
    /credit[-_]?card/i,
    /card[-_]?number/i,
    /cvv/i,
    /cvc/i,
    /credentials?/i,
  ],
  fuzzyKeyMatch: true,
  caseSensitiveKeyMatch: false,
  serialise: false,
})

export function sanitizeLogData<T>(data: T): T {
  return redactor.redact(data) as T
}
