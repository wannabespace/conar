import process from 'node:process'
import { intro, isCancel, log, outro, select } from '@clack/prompts'
import { auth } from '~/commands/auth'
import { query } from '~/commands/query'
import { getToken } from '~/config'
import '@conar/shared/arktype-config'

async function main() {
  intro('Conar CLI')

  const token = getToken()

  if (!token) {
    log.warn('You are not signed in.')
  }

  const action = await select({
    message: 'What would you like to do?',
    options: [
      { value: 'auth', label: 'Sign in' },
      { value: 'query', label: 'Execute a query' },
    ],
  })

  if (isCancel(action)) {
    outro('Bye!')
    return
  }

  try {
    if (action === 'auth') {
      await auth()
    }
    else if (action === 'query') {
      if (!token) {
        log.error('You must sign in first. Run the CLI and choose "Sign in".')
        outro('Bye!')
        return
      }

      await query()
    }
  }
  catch (error) {
    log.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }

  outro('Done!')
}

main()
