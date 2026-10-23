import { deepRedact } from '@hackylabs/deep-redact'

const URL_PASSWORD = /(?<user>\/\/[^\s/:@]*:)[^\s@]+@/gu
const KEY_VALUE_SECRET =
  /(?<key>(?:password|pwd|authToken|access_token|token)\s*=\s*)[^\s;&'"]+/giu

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
    /invalidData/iu,
  ],
  serialise: false,
  // Strings that embed a connection string (chat text, SQL, driver errors) carry no key to match.
  stringTests: [
    {
      pattern: URL_PASSWORD,
      replacer: (value, pattern) =>
        value.replace(pattern, '$<user>[REDACTED]@'),
    },
    {
      pattern: KEY_VALUE_SECRET,
      replacer: (value, pattern) => value.replace(pattern, '$<key>[REDACTED]'),
    },
  ],
  transformers: {
    byConstructor: {
      // Unconverted, an Error is logged as-is: a validation error's `invalidData` holds the whole raw input.
      Error: [
        (error) => {
          const { cause, message, name, stack } = error as Error
          return { ...(error as Error), cause, message, name, stack }
        },
      ],
    },
  },
})

export const sanitizeLogData = <T>(data: T): T => redactor(data) as T
