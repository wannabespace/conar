import { command } from '@drizzle-team/brocli'
import { consola } from 'consola'
import ora from 'ora'
import { clearStoredAuth, CONAR_API_KEY_ENV, getAuthState } from '~/config'
import { getSessionFromToken } from '~/session'

export const whoamiCommand = command({
  name: 'whoami',
  desc: 'Show the current authentication status',
  options: {},
  handler: async () => {
    const auth = getAuthState()

    if (!auth) {
      consola.info(`Not authenticated. Run \`conar login\` or set \`${CONAR_API_KEY_ENV}\`.`)
      return
    }

    const spinner = ora('Verifying session...').start()
    const session = await getSessionFromToken(auth.token)
    spinner.stop()

    if (!session) {
      if (auth.source === 'config') {
        clearStoredAuth()
      }

      consola.warn(
        auth.source === 'env'
          ? `The \`${CONAR_API_KEY_ENV}\` value is invalid. Update or unset it.`
          : auth.method === 'api-key'
            ? `Your saved API key is no longer valid. Run \`conar login --api-key <key>\` or set \`${CONAR_API_KEY_ENV}\`.`
            : 'Saved session is no longer valid. Run `conar login` to sign in again.',
      )
      return
    }

    const label = auth.source === 'env'
      ? ` (api key via ${CONAR_API_KEY_ENV})`
      : auth.method === 'api-key'
        ? ' (api key)'
        : ''

    consola.log(`${session.user.email}${label}`)
  },
})
