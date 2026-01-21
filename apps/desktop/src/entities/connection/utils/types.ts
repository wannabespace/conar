export type WithSchema<T, Prefix extends string> = {
  [K in keyof T as `${Prefix}.${Extract<K, string>}`]: T[K]
}
