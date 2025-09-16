export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export function enumValues<T extends { [key: string]: string }>(enumType: T) {
  return Object.values(enumType) as [T[keyof T], ...T[keyof T][]]
}

export function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout>

  const debounced = (...args: Parameters<F>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), waitFor)
  }

  return debounced
}

export function prepareSql(input: string) {
  return input.replaceAll('\n', ' ').replace(/\s+/g, ' ').trim()
}

export function isDeeplyEqual(a: object, b: object): boolean {
  if (a === b)
    return true

  if (a && typeof a === 'object' && b && typeof b === 'object') {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length)
        return false

      for (let i = 0; i < a.length; i++) {
        if (!isDeeplyEqual(a[i], b[i]))
          return false
      }
      return true
    }

    if (Array.isArray(a) !== Array.isArray(b))
      return false

    const keysA = Object.keys(a) as (keyof typeof a)[]
    const keysB = Object.keys(b) as (keyof typeof b)[]

    if (keysA.length !== keysB.length)
      return false

    for (const key of keysA) {
      if (!keysB.includes(key) || !isDeeplyEqual(a[key], b[key])) {
        return false
      }
    }
    return true
  }

  return false
}
