import { SafeURL } from '@tamery/shared/safe-url'

import { SSH_DESKTOP_ONLY, sshTunnelOf } from './params'
import type { tunnelSocket } from './socket'

export interface Forwarding {
  /** Opens the SSH session, prompting for an unknown host key, so a driver's connect timeout never runs while the prompt is up. */
  connect: () => Promise<void>
  socket: () => ReturnType<typeof tunnelSocket>
}

let forwardingOf = (connectionString: string): Forwarding | null => {
  if (sshTunnelOf(new SafeURL(connectionString).searchParams)) {
    throw new Error(SSH_DESKTOP_ONLY)
  }
  return null
}

/**
 * How the dialect clients reach a database behind the string's SSH tunnel; null for a string without one.
 * Only the desktop main process plugs tunnels in, so the CLI and proxies, which bundle the dialects, never load ssh2.
 */
export const sshForwarding = {
  of: (connectionString: string) => forwardingOf(connectionString),
  use: (open: typeof forwardingOf) => {
    forwardingOf = open
  },
}
