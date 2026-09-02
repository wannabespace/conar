export { cn } from 'cnfast'

export const pseudoRandom = (seed: number) =>
  Math.abs(Math.sin(seed * 127.1 + 311.7)) % 1
