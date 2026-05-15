#!/usr/bin/env node
import process from 'node:process'
import { run } from '@drizzle-team/brocli'
import { consola } from 'consola'
import { loginCommand } from '~/commands/login'
import { logoutCommand } from '~/commands/logout'
import { proxyCommand } from '~/commands/proxy'
import { queryCommand } from '~/commands/query'
import { whoamiCommand } from '~/commands/whoami'
import { checkForUpdate } from '~/update-check'

const currentVersion: string = import.meta.env.VERSION

const commands = [
  loginCommand,
  logoutCommand,
  proxyCommand,
  queryCommand,
  whoamiCommand,
]

const updateCheck = checkForUpdate(currentVersion)

run(commands, {
  name: 'conar',
  description: 'Conar CLI – manage and query your connections from the terminal.',
  version: currentVersion,
}).catch((error: unknown) => {
  consola.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}).finally(async () => {
  const latestVersion = await updateCheck

  if (latestVersion) {
    consola.box({
      title: 'Update available',
      message: `${currentVersion} → ${latestVersion}\nRun \`npm i -g conar\` to update`,
      style: {
        borderColor: 'yellow',
      },
    })
  }
})
