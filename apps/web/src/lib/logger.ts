import type { ConsolaInstance, LogType } from 'consola'
import { createConsola } from 'consola'
import { colorize } from 'consola/utils'

let loggerInstance: ConsolaInstance

// eslint-disable-next-line ts/no-explicit-any
type Messages = [unknown, ...any[]]

async function _log(type: LogType, ...messages: Messages) {
  loggerInstance ||= createConsola()

  const method = loggerInstance[type]

  method(...messages)
}

const logger = {
  info: (...messages: Messages) => _log('info', ...messages),
  success: (...messages: Messages) => _log('success', ...messages),
  warn: (...messages: Messages) => _log('warn', ...messages),
  error: (...messages: Messages) => _log('error', ...messages),
  fatal: (...messages: Messages) => _log('fatal', ...messages),
  debug: (...messages: Messages) => _log('debug', ...messages),
  trace: (...messages: Messages) => _log('trace', ...messages),
  silent: (...messages: Messages) => _log('silent', ...messages),
  log: (...messages: Messages) => _log('log', ...messages),
  fail: (...messages: Messages) => _log('fail', ...messages),
  verbose: (...messages: Messages) => _log('verbose', ...messages),
} satisfies Record<Exclude<LogType, 'box' | 'start' | 'ready'>, (message: string) => void>

export function createLogger(contextName: string): typeof logger {
  return Object.fromEntries(
    Object.entries(logger).map(([name, log]) => [
      name,
      (...messages: Messages) => log(colorize('blue', `[${contextName}]`), ...messages),
    ]),
  ) as typeof logger
}
