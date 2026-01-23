export type WithSchema<T, Prefix extends string> = {
  [K in keyof T as `${Prefix}.${Extract<K, string>}`]: T[K]
}

export type GeneratorFormat = 'ts' | 'zod' | 'prisma' | 'sql' | 'drizzle' | 'kysely'
export type ConnectionDialect = 'postgres' | 'mysql' | 'mssql' | 'clickhouse'
export type PrismaFilterValue = string | number | boolean | Date | null | { [key: string]: PrismaFilterValue } | PrismaFilterValue[]
