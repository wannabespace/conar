import { text } from 'node:stream/consumers'
import { promisify } from 'node:util'

import { Result } from 'better-result'
import type { Client } from 'ssh2'

import { tunnelError } from './params'

// A lookup runs commands on the SSH host, so a dotted host (real DNS) or localhost never triggers one.
const BARE_NAME = /^(?!localhost$)[a-z0-9][\w-]*$/iu

const SERVICE_LABEL = 'com.docker.compose.service'

// Single quotes are the only shell syntax used, so a fish or csh login shell runs it too, and the host never enters the command.
const INSPECT_FORMAT = `'{{.Name}} {{index .Config.Labels "${SERVICE_LABEL}"}}{{range .NetworkSettings.Networks}} {{.IPAddress}}{{end}}'`

const run = async (client: Client, command: string) => {
  const channel = await promisify(client.exec.bind(client))(command)
  return text(channel)
}

const listContainers = async (client: Client) => {
  const running = await run(client, 'docker ps -q')
  const ids = running.split(/\s+/u).filter(Boolean)
  if (ids.length === 0) {
    return []
  }
  const inspected = await run(
    client,
    `docker inspect -f ${INSPECT_FORMAT} ${ids.join(' ')}`
  )
  return inspected
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [name = '', service = '', ...addresses] = line.split(' ')
      return {
        address: addresses.find(Boolean),
        name: name.slice(1),
        service,
      }
    })
}

/** A bare host names a running container or Compose service on the SSH host; a lookup that finds nothing keeps the host as written. */
export const dockerAddress = async (client: Client, host: string) => {
  if (!BARE_NAME.test(host)) {
    return host
  }
  const listed = await Result.tryPromise(() => listContainers(client))
  const containers = listed.unwrapOr([])
  const named = containers.find((container) => container.name === host)
  const ofService = containers.filter((container) => container.service === host)
  if (!named && ofService.length > 1) {
    throw tunnelError(
      `Several containers run the service ${host}: ${ofService.map((container) => container.name).join(', ')}. Use the container name as the host.`
    )
  }
  return (named ?? ofService[0])?.address ?? host
}
