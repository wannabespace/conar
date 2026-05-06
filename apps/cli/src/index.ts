#!/usr/bin/env node
import process from 'node:process'
import { run } from '@drizzle-team/brocli'
import { consola } from 'consola'
import { loginCommand } from '~/commands/login'
import { logoutCommand } from '~/commands/logout'
import { queryCommand } from '~/commands/query'
import { whoamiCommand } from '~/commands/whoami'

const commands = [
  loginCommand,
  logoutCommand,
  queryCommand,
  whoamiCommand,
]

run(commands, {
  name: 'conar',
  description: 'Conar CLI – manage and query your databases from the terminal.',
  version: import.meta.env.VERSION,
}).catch((error: unknown) => {
  consola.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
