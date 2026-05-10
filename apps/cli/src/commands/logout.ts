import { command } from '@drizzle-team/brocli'
import { consola } from 'consola'
import ora from 'ora'
import { clearStoredAuth, CONAR_API_KEY_ENV, getAuthState } from '~/config'
import { serverSignOut } from '~/session'

export const logoutCommand = command({
  name: 'logout',
  desc: 'Clear saved CLI authentication',
  options: {},
  handler: async () => {
    const auth = getAuthState()

    if (!auth) {
      consola.info('You are not signed in.')
      return
    }

    if (auth.source === 'env') {
      clearStoredAuth()
      consola.info(`Cleared any saved credentials, but ${CONAR_API_KEY_ENV} is still set.`)
      consola.info(`Unset ${CONAR_API_KEY_ENV} to stop using that API key.`)
      return
    }

    const spinner = ora(auth.method === 'session' ? 'Signing out...' : 'Removing saved API key...').start()
    await serverSignOut()
    clearStoredAuth()
    spinner.stop()
    consola.success(auth.method === 'session' ? 'Signed out.' : 'Removed saved API key.')
  },
})
