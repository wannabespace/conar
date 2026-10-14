import { expect, jest, test } from 'bun:test'

import { EMPTY_SSH_TUNNEL } from './params'
import { connectSsh } from './session'

test('a key ssh2 cannot parse fails as a tunnel error and arms no handshake timeout', async () => {
  const rejections: unknown[] = []
  const collect = (reason: unknown) => rejections.push(reason)
  process.on('unhandledRejection', collect)
  jest.useFakeTimers()
  try {
    await expect(
      connectSsh(
        {
          ...EMPTY_SSH_TUNNEL,
          auth: 'key',
          host: '127.0.0.1',
          privateKey: 'not a key',
        },
        () => Promise.resolve(false)
      )
    ).rejects.toThrow("SSH tunnel: The SSH key couldn't be read")
    jest.advanceTimersByTime(60_000)
    jest.useRealTimers()
    await Bun.sleep(10)
    expect(rejections).toEqual([])
  } finally {
    jest.useRealTimers()
    process.off('unhandledRejection', collect)
  }
})
