import { lookup } from 'node:dns/promises'
import { BlockList } from 'node:net'

import { ORPCError } from '@orpc/server'
import { readConnectionString } from '@tamery/connection/parse-connection-string'

const NON_PUBLIC_NETWORKS = new BlockList()
for (const [network, prefix, family] of [
  ['0.0.0.0', 8, 'ipv4'],
  ['10.0.0.0', 8, 'ipv4'],
  ['100.64.0.0', 10, 'ipv4'],
  ['127.0.0.0', 8, 'ipv4'],
  ['169.254.0.0', 16, 'ipv4'],
  ['172.16.0.0', 12, 'ipv4'],
  ['192.0.0.0', 24, 'ipv4'],
  ['192.168.0.0', 16, 'ipv4'],
  ['198.18.0.0', 15, 'ipv4'],
  ['224.0.0.0', 3, 'ipv4'],
  ['::', 128, 'ipv6'],
  ['::1', 128, 'ipv6'],
  ['64:ff9b::', 96, 'ipv6'],
  ['2002::', 16, 'ipv6'],
  ['fe80::', 10, 'ipv6'],
  ['fc00::', 7, 'ipv6'],
  ['ff00::', 8, 'ipv6'],
] as const) {
  NON_PUBLIC_NETWORKS.addSubnet(network, prefix, family)
}

/**
 * The driver resolves the host again, so a DNS answer that changes between the two lookups still slips through.
 * An empty host is refused too: drivers fall back to localhost for it.
 */
export const assertPublicHost = async (connectionString: string) => {
  const { host } = readConnectionString(connectionString)
  const addresses = host ? await lookup(host, { all: true }) : []
  if (
    addresses.length === 0 ||
    addresses.some(({ address, family }) =>
      NON_PUBLIC_NETWORKS.check(address, family === 6 ? 'ipv6' : 'ipv4')
    )
  ) {
    throw new ORPCError('FORBIDDEN', {
      message:
        'The cloud proxy reaches only public hosts. Run `tamery proxy` or open this connection in the desktop app.',
    })
  }
}

/** The drivers read each of these as a path on the proxy's own disk. */
const FILE_PARAMS = ['sslca', 'sslcert', 'sslkey', 'sslrootcert']

export const assertNoServerFiles = (connectionString: string) => {
  const { searchParams } = readConnectionString(connectionString)
  if (FILE_PARAMS.some((param) => searchParams.has(param))) {
    throw new ORPCError('FORBIDDEN', {
      message:
        'The cloud proxy cannot read certificate files. Run `tamery proxy` or open this connection in the desktop app.',
    })
  }
}
