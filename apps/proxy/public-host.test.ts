import { expect, test } from 'bun:test'

import { assertNoServerFiles, assertPublicHost } from './public-host'

test.each([
  'postgres://u:p@127.0.0.1/db',
  'postgres://u:p@localhost/db',
  'postgres://u:p@0.0.0.0/db',
  'postgres://u:p@10.1.2.3/db',
  'postgres://u:p@172.16.0.1/db',
  'postgres://u:p@192.168.1.1/db',
  'postgres://u:p@169.254.169.254/db',
  'postgres://u:p@100.100.100.200/db',
  'postgres://u:p@198.18.0.1/db',
  'postgres://u:p@224.0.0.1/db',
  'postgres://u:p@255.255.255.255/db',
  'postgres://u:p@[64:ff9b::7f00:1]/db',
  'postgres://u:p@[2002:7f00:1::]/db',
  'postgres://u:p@[::]/db',
  'postgres://u:p@[::1]/db',
  'postgres://u:p@[fe80::1]/db',
  'postgres://u:p@[fd00::1]/db',
  'postgres://u:p@[::ffff:127.0.0.1]/db',
  'postgres:///db',
  'sqlite:///etc/hosts',
  'duckdb:///etc/hosts',
])('refuses %p', async (connectionString) => {
  await expect(assertPublicHost(connectionString)).rejects.toThrow(
    'only public hosts'
  )
})

test.each(['postgres://u:p@8.8.8.8/db', 'postgres://u:p@[2001:4860::8888]/db'])(
  'allows %p',
  async (connectionString) => {
    await expect(assertPublicHost(connectionString)).resolves.toBeUndefined()
  }
)

test.each([
  'postgres://u:p@8.8.8.8/db?sslrootcert=/etc/passwd',
  'mysql://u:p@8.8.8.8/db?sslCA=/etc/passwd',
])('refuses a file on its own disk in %p', (connectionString) => {
  expect(() => assertNoServerFiles(connectionString)).toThrow(
    'cannot read certificate files'
  )
})
