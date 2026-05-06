import { command } from '@drizzle-team/brocli'
import { consola } from 'consola'
import ora from 'ora'
import { clearToken, getToken } from '~/config'
import { serverSignOut } from '~/session'

export const logoutCommand = command({
  name: 'logout',
  desc: 'Sign out of your Conar account',
  options: {},
  handler: async () => {
    if (!getToken()) {
      consola.info('You are not signed in.')
      return
    }

    const spinner = ora('Signing out...').start()
    await serverSignOut()
    clearToken()
    spinner.stop()
    consola.success('Signed out.')
  },
})
