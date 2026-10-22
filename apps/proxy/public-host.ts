import type { LookupAddress } from 'node:dns'
import { lookup } from 'node:dns/promises'
import type { LookupFunction } from 'node:net'
import { BlockList } from 'node:net'

import { ORPCError } from '@orpc/server'
import { readConnectionString } from '@tamery/connection/parse-connection-string'
import { toError } from '@tamery/shared/utils'
import { Result } from 'better-result'

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

/** The drivers read each of these as a path on the proxy's own disk. */
const FILE_PARAMS = [
  'sslca',
  'sslcert',
  'sslkey',
  'sslrootcert',
  'tlscafile',
  'tlscertificatekeyfile',
]

export const PRIVATE_HOST_MESSAGE =
  'The cloud proxy reaches only public hosts. Run `tamery proxy` or open this connection in the desktop app.'

const SRV_SCHEME = 'mongodb+srv'

const isPublic = ({ address, family }: LookupAddress) =>
  !NON_PUBLIC_NETWORKS.check(address, family === 6 ? 'ipv6' : 'ipv4')

const publicAddresses = async (hostname: string) => {
  const addresses = await lookup(hostname, { all: true })
  if (addresses.length === 0 || !addresses.every(isPublic)) {
    throw new ORPCError('FORBIDDEN', { message: PRIVATE_HOST_MESSAGE })
  }
  return addresses
}

/** A socket lookup that refuses non-public addresses; the MongoDB driver dials every server it discovers through it. */
export const publicLookup: LookupFunction = (hostname, options, respond) => {
  void (async () => {
    const found = await Result.tryPromise(() => publicAddresses(hostname))
    if (found.isErr()) {
      respond(toError(found.error.cause), '')
      return
    }
    const [first] = found.value
    // Node asks for every address when it races IPv4 against IPv6 (`autoSelectFamily`), else for one.
    if (options.all) {
      respond(null, found.value)
    } else if (first) {
      respond(null, first.address, first.family)
    }
  })()
}

/**
 * The driver resolves the host again, so a DNS answer that changes between the two lookups still slips through.
 * An empty host is refused too: drivers fall back to localhost for it.
 */
export const assertReachable = async (connectionString: string) => {
  const { host, scheme, searchParams } = readConnectionString(connectionString)
  if (FILE_PARAMS.some((param) => searchParams.has(param))) {
    throw new ORPCError('FORBIDDEN', {
      message:
        'The cloud proxy cannot read certificate files. Run `tamery proxy` or open this connection in the desktop app.',
    })
  }
  // An SRV name has no address of its own: the servers it lists are checked by `publicLookup` as the driver dials them.
  if (host && scheme === SRV_SCHEME) {
    return
  }
  if (!host) {
    throw new ORPCError('FORBIDDEN', { message: PRIVATE_HOST_MESSAGE })
  }
  await publicAddresses(host)
}
