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
