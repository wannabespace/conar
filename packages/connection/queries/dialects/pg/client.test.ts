import { expect, mock, spyOn, test } from 'bun:test'

import { Pool } from 'pg'

import { SSH_DESKTOP_ONLY } from '../../../ssh/params'
import { getPool } from './client'

test('both initial and SSL fallback pools handle idle-client errors', async () => {
  const logging = spyOn(console, 'error').mockImplementation(mock())
  const poolQuery = spyOn(Pool.prototype, 'query')
    .mockImplementationOnce(() => {
      throw new Error('SSL required')
    })
    .mockImplementation(() =>
      Promise.resolve({
        command: 'SELECT',
        fields: [],
        oid: 0,
        rowCount: 0,
        rows: [],
      })
    )
  const listeners = spyOn(Pool.prototype, 'on')
  try {
    await getPool('postgres://user:password@host/db')
    expect(listeners.mock.calls).toHaveLength(2)
    for (const [event, listener] of listeners.mock.calls) {
      expect(event).toBe('error')
      expect(listener).toBe(console.error)
    }
    for (const pool of poolQuery.mock.contexts.slice(0, 2)) {
      expect(
        pool instanceof Pool &&
          pool.emit('error', new Error('idle connection dropped'))
      ).toBe(true)
    }
    expect(logging).toHaveBeenCalledTimes(2)
  } finally {
    logging.mockRestore()
    poolQuery.mockRestore()
    listeners.mockRestore()
  }
})

test('an SSH string reaches no driver unless the desktop app opens its tunnel', async () => {
  const connect = spyOn(Pool.prototype, 'query')
  try {
    await expect(
      getPool('postgres://user@db.internal/db?ssh_host=bastion')
    ).rejects.toThrow(SSH_DESKTOP_ONLY)
    expect(connect).not.toHaveBeenCalled()
  } finally {
    connect.mockRestore()
  }
})
