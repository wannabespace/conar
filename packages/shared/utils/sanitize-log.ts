import { deepRedact } from '@hackylabs/deep-redact'

const redactor = deepRedact({
  caseSensitiveKeyMatch: false,
  fuzzyKeyMatch: true,
  keys: [
    /password/iu,
    /passwd/iu,
    /secret/iu,
    /token/iu,
    /api[-_]?key/iu,
    /authorization/iu,
    /cookie/iu,
    /session/iu,
    /credit[-_]?card/iu,
    /card[-_]?number/iu,
    /cvv/iu,
    /cvc/iu,
    /credentials?/iu,
    /connectionString?/iu,
  ],
  serialise: false,
})

export const sanitizeLogData = <T>(data: T): T => redactor(data) as T
