import { isSshConnectionString } from '../utils'
import { SSH_DESKTOP_ONLY } from './params'
import type { tunnelSocket } from './socket'

export interface Forwarding {
  socket: () => ReturnType<typeof tunnelSocket>
}

let forwardingOf = (connectionString: string): Promise<Forwarding | null> => {
  if (isSshConnectionString(connectionString)) {
    throw new Error(SSH_DESKTOP_ONLY)
  }
  return Promise.resolve(null)
}

/**
 * Resolves once the SSH session is open, an unknown host key's prompt included, so a driver's connect timeout never runs while the prompt is up.
 * Only the desktop main process plugs tunnels in, so the CLI and proxies, which bundle the dialects, never load ssh2.
 */
export const sshForwarding = {
  of: (connectionString: string) => forwardingOf(connectionString),
  use: (open: typeof forwardingOf) => {
    forwardingOf = open
  },
}
