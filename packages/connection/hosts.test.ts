import { expect, test } from 'bun:test'

import { isInternalHost } from './hosts'

test.each([
  'localhost',
  '0.0.0.0',
  '::',
  '127.0.0.1',
  '10.0.0.5',
  '169.254.169.254',
  'fe80::1',
  'fd00::1',
  'db',
  'db.internal',
])('%p is internal', (host) => {
  expect(isInternalHost(host)).toBe(true)
})

test.each(['db.acme.io', '8.8.8.8', '2001:db8::5'])('%p is public', (host) => {
  expect(isInternalHost(host)).toBe(false)
})
