export { cn } from 'cn'

export const pseudoRandom = (seed: number) =>
  Math.abs(Math.sin(seed * 127.1 + 311.7)) % 1

export const parseStorage = <T>(key: string): T | undefined => {
  const raw = localStorage.getItem(key)

  try {
    return raw === null ? undefined : (JSON.parse(raw) as T)
  } catch {
    return undefined
  }
}
