export type { Database as MysqlDatabase } from './mysql'
export type { Database as PostgresDatabase } from './postgres'

export type WithSchema<T, Prefix extends string> = {
  [K in keyof T as `${Prefix}.${Extract<K, string>}`]: T[K]
}
