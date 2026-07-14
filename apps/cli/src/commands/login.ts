import process from 'node:process'

import { challenge } from '@conar/shared/utils/challenge'
import { boolean, command } from '@drizzle-team/brocli'
import { consola } from 'consola'
import open from 'open'
import ora from 'ora'

import { clearToken, saveToken } from '~/config'
import { orpc } from '~/orpc'
import { getSession } from '~/session'

const MAIN_URL = import.meta.env.MAIN_URL

const AUTH_TIMEOUT_MS = 5 * 60 * 1000

export const loginCommand = command({
  name: 'login',
  desc: 'Sign in to your Conar account',
  options: {
    force: boolean().alias('f').desc('Sign in even if already authenticated'),
    noOpen: boolean('no-open').desc('Do not attempt to open the browser automatically'),
  },
  handler: async opts => {
    const existing = await getSession()

    if (existing && !opts.force) {
      consola.info(`Already signed in as ${existing.user.email}.`)
      consola.info('Use --force to sign in with a different account.')
      return
    }

    if (existing) {
      clearToken()
    }

    const verifier = challenge.noble.generateVerifier()
    const codeChallenge = challenge.noble.generateCode(verifier)
    const url = `${MAIN_URL}/deep/sign-in?codeChallenge=${codeChallenge}&type=cli`

    const controller = new AbortController()
    const onSigint = () => controller.abort(new Error('Cancelled'))
    process.once('SIGINT', onSigint)

    const timeout = setTimeout(() => controller.abort(new Error('Timeout')), AUTH_TIMEOUT_MS)

    let browserOpened = false

    if (!opts.noOpen) {
      try {
        await open(url)
        browserOpened = true
      } catch {
        browserOpened = false
      }
    }

    consola.box({
      title: browserOpened ? 'Browser opened' : 'Open this URL to sign in',
      message: `${url}\n\nThis link expires in 5 minutes.`,
      style: { borderColor: 'cyan', borderStyle: 'rounded', padding: 1 },
    })

    const spinner = ora('Waiting for sign in...').start()

    try {
      const events = await orpc.account.challenge.listen(
        { codeChallenge },
        { signal: controller.signal },
      )

      let ready = false
      for await (const event of events) {
        if (event.ready) {
          ready = true
          break
        }
      }

      if (!ready) {
        throw new Error('Stream ended before authentication completed')
      }

      spinner.text = 'Exchanging credentials...'

      const { token } = await orpc.account.challenge.exchange(
        { codeChallenge, verifier },
        { signal: controller.signal },
      )

      saveToken(token)

      const session = await getSession()
      spinner.stop()
      consola.success(session ? `Signed in as ${session.user.email}.` : 'Signed in successfully.')
    } catch (error) {
      spinner.stop()

      const reason = controller.signal.aborted
        ? (controller.signal.reason as Error | undefined)?.message
        : undefined

      if (reason === 'Timeout') {
        consola.fail('Sign in timed out. No response within 5 minutes.')
        process.exit(1)
      }

      if (reason === 'Cancelled') {
        consola.fail('Sign in cancelled.')
        process.exit(1)
      }

      consola.fail(`Sign in failed: ${error instanceof Error ? error.message : String(error)}`)
      process.exit(1)
    } finally {
      clearTimeout(timeout)
      process.off('SIGINT', onSigint)
    }
  },
})
