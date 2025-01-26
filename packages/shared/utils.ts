export function enumValues<T extends { [key: string]: string }>(enumType: T) {
  return Object.values(enumType) as [T[keyof T], ...T[keyof T][]]
}
