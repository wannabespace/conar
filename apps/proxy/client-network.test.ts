import { expect, test } from 'bun:test'

import { clientNetwork } from './client-network'

test.each([
  ['203.0.113.7', '203.0.113.7'],
  ['::ffff:203.0.113.7', '203.0.113.7'],
  ['2001:db8:1:2:3:4:5:6', '2001:db8:1:2'],
  ['2001:db8:1:2::9', '2001:db8:1:2'],
  ['2001:db8::1', '2001:db8:0:0'],
])('%p is the network %p', (ip, network) => {
  expect(clientNetwork(new Headers({ 'x-real-ip': ip }))).toBe(network)
})
