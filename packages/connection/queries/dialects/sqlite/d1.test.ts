import { afterEach, describe, expect, spyOn, test } from 'bun:test'

import { query } from '.'

const CONNECTION = 'd1://acc:tok@api.cloudflare.com/db-id'

const answer = (result: unknown) =>
  Response.json({ errors: [], messages: [], result, success: true })

const failure = (message: string) =>
  Response.json(
    {
      errors: [{ code: 7500, message }],
      messages: [],
      result: [],
      success: false,
    },
    { status: 400 }
  )

const set = (columns: string[], rows: unknown[][], changes = 0) => ({
  meta: { changes },
  results: { columns, rows },
})

let stubbed: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>> | null = null

const stubFetch = (...responses: Response[]) => {
  stubbed = spyOn(globalThis, 'fetch')
  for (const response of responses) {
    stubbed.mockResolvedValueOnce(response)
  }
  return stubbed
}

const sentBodies = (fetch: ReturnType<typeof stubFetch>) =>
  fetch.mock.calls.map(([, init]) => JSON.parse(String(init?.body)))

afterEach(() => {
  stubbed?.mockRestore()
  stubbed = null
})

describe('D1', () => {
  test('sends one statement to the account and database the string names', async () => {
    const fetch = stubFetch(answer([set(['n'], [[1]])]))

    const { result } = await query.execute({
      connectionString: CONNECTION,
      query: 'select ? as n',
      values: [true],
    })

    const [[url, init]] = fetch.mock.calls as [[string, RequestInit]]
    expect(url).toBe(
      'https://api.cloudflare.com/client/v4/accounts/acc/d1/database/db-id/raw'
    )
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer tok')
    expect(sentBodies(fetch)).toEqual([{ params: [1], sql: 'select ? as n' }])
    expect(result).toEqual([
      { affectedRows: null, columns: ['n'], rows: [[1]], truncated: false },
    ])
  })

  test('sends several statements as one batch', async () => {
    const fetch = stubFetch(answer([set([], [], 2), set(['a'], [[1], [2]])]))

    const { result } = await query.execute({
      connectionString: CONNECTION,
      maxRows: 1,
      query: 'delete from t; select a from t',
    })

    expect(sentBodies(fetch)).toEqual([
      {
        batch: [
          { params: [], sql: 'delete from t' },
          { params: [], sql: 'select a from t' },
        ],
      },
    ])
    expect(
      result.map(({ affectedRows, truncated }) => [affectedRows, truncated])
    ).toEqual([
      [2, false],
      [null, true],
    ])
  })

  test('holds a write transaction until commit, then sends it as a batch', async () => {
    const fetch = stubFetch(answer([set([], [], 1), set([], [], 1)]))
    const { txId } = await query.beginTransaction({
      connectionString: CONNECTION,
    })

    await query.executeTransaction({
      query: 'insert into t values (1)',
      txId,
      values: [],
    })
    await query.executeTransaction({
      query: 'insert into t values (?)',
      txId,
      values: [2],
    })
    expect(fetch).not.toHaveBeenCalled()
    await query.commitTransaction({ txId })

    expect(sentBodies(fetch)).toEqual([
      {
        batch: [
          { params: [], sql: 'insert into t values (1)' },
          { params: [2], sql: 'insert into t values (?)' },
        ],
      },
    ])
  })

  test('sends nothing for a rolled back transaction', async () => {
    const fetch = stubFetch()
    const { txId } = await query.beginTransaction({
      connectionString: CONNECTION,
    })

    await query.executeTransaction({ query: 'delete from t', txId, values: [] })
    await query.rollbackTransaction({ txId })

    expect(fetch).not.toHaveBeenCalled()
  })

  test("raises Cloudflare's own message", async () => {
    stubFetch(failure('no such table: t: SQLITE_ERROR'))

    await expect(
      query.execute({ connectionString: CONNECTION, query: 'select * from t' })
    ).rejects.toThrow('No such table: t: SQLITE_ERROR')
  })
})
