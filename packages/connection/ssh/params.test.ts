import { expect, test } from 'bun:test'

import { deleteSshParams } from './params'

test('deleteSshParams drops the ssh_* params whatever their case and keeps the driver options', () => {
  const searchParams = new URLSearchParams(
    'SSH_HOST=bastion&Ssh_User=me&ssh_port=2222&request_timeout=1000'
  )
  deleteSshParams(searchParams)
  expect(searchParams.toString()).toBe('request_timeout=1000')
})
