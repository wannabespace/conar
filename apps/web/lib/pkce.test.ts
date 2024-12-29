import { describe, expect, it } from 'vitest'
import { generateCodeChallenge, generateRandomString } from './pkce'

describe('pkce', () => {
  it('should generate random string', () => {
    const randomString = generateRandomString(10)

    expect(randomString).toHaveLength(10)
  })

  it('should generate code challenge', async () => {
    const verifier = generateRandomString(32)
    const challenge = await generateCodeChallenge(verifier)

    expect(challenge).toHaveLength(43)
  })
})
