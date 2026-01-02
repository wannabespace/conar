import type { DatabaseType } from '@conar/shared/enums/database-type'

export type WithSchema<T, Prefix extends string> = {
  [K in keyof T as `${Prefix}.${Extract<K, string>}`]: T[K]
}

export type GeneratorFormat = 'ts' | 'zod' | 'prisma' | 'sql' | 'drizzle' | 'kysely'
export type DatabaseDialect = `${DatabaseType}`
