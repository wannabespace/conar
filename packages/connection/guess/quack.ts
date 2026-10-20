import type { DatabaseGuess } from './types'
import { guessUrl } from './url'

/** DuckDB spells a Quack server `quack:host:port`, without the slashes the URL detector needs. */
const QUACK_URI = /^quack:(?!\/\/)(?<address>[^\s/?#]+)$/iu

export const guessQuack = (text: string): DatabaseGuess | null => {
  const address = QUACK_URI.exec(text.trim())?.groups?.address
  return address ? guessUrl(`quack://${address}`) : null
}
