export type WithSchema<T, Prefix extends string> = {
  [K in keyof T as `${Prefix}.${Extract<K, string>}`]: T[K]
}

export type GeneratorFormat = 'ts' | 'zod' | 'prisma' | 'sql' | 'drizzle' | 'kysely'
export type PrismaFilterValue = string | number | boolean | Date | null | { [key: string]: PrismaFilterValue } | PrismaFilterValue[]

export interface Index {
  schema: string
  table: string
  name: string
  column: string
  isUnique: boolean
  isPrimary: boolean
}
