import { log, spinner } from '@clack/prompts'
import { generateCodeChallenge, generateVerifier } from '@conar/shared/utils/challenge'
import open from 'open'
import { saveToken } from '~/config'
import { MAIN_URL } from '~/env'
import { apiClient } from '~/orpc'

export async function auth() {
  const verifier = generateVerifier()
  const codeChallenge = await generateCodeChallenge(verifier)

  const url = `${MAIN_URL}/deep/sign-in?codeChallenge=${codeChallenge}&type=cli`

  log.info(`Opening browser for sign in: ${url}`)

  await open(url)

  const s = spinner()
  s.start('Waiting for authentication...')

  try {
    for await (const event of await apiClient.account.challenge.listen({ codeChallenge })) {
      if (event.ready) {
        break
      }
    }

    const { token } = await apiClient.account.challenge.exchange({ codeChallenge, verifier })

    saveToken(token)
    s.stop('Authenticated successfully!')
  }
  catch (error) {
    s.stop('Authentication failed.')
    throw error
  }
}
