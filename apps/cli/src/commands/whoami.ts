import { command } from '@drizzle-team/brocli'
import { consola } from 'consola'
import ora from 'ora'

import { clearToken, getToken } from '~/config'
import { getSession } from '~/session'

export const whoamiCommand = command({
  name: 'whoami',
  desc: 'Show the currently signed-in user',
  options: {},
  handler: async () => {
    if (!getToken()) {
      consola.info('Not signed in.')
      return
    }

    const spinner = ora('Verifying session...').start()
    const session = await getSession()
    spinner.stop()

    if (!session) {
      clearToken()
      consola.warn('Saved session is no longer valid. Run `tamery login` to sign in again.')
      return
    }

    consola.log(session.user.email)
  },
})
