import type { ErrorMessage, Prettify } from '@conar/shared/utils/helpers'

export type DialectType<T extends object, F extends { [K in keyof T]?: T[K] }> = keyof F extends keyof T
  ? Prettify<T & F>
  : ErrorMessage<'Each key of the object must exist in the type'>
