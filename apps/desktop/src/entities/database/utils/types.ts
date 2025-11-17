import type { Prettify, Satisfies } from '@conar/shared/utils/helpers'

export type DialectType<T extends object, F extends { [K in keyof T]?: T[K] }> = keyof F extends keyof T
  ? Prettify<Satisfies<T, T & F>>
  : 'Each key of F must exist in T'
