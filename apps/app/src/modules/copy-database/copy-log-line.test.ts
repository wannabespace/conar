import { describe, expect, it } from 'bun:test'

import {
  appendCopyLog,
  parseCopyLogLine,
  toFailureEntries,
} from './copy-log-line'

describe('parseCopyLogLine', () => {
  it('names created objects and copied tables without the tool prefix', () => {
    expect(
      parseCopyLogLine(
        'pg_dump: creating FK CONSTRAINT "public.orders orders_customer_id_fkey"'
      )
    ).toEqual({
      kind: 'step',
      object: 'FK CONSTRAINT',
      text: 'public.orders orders_customer_id_fkey',
    })
    expect(
      parseCopyLogLine('pg_dump: dumping contents of table "public.orders"')
    ).toEqual({ kind: 'step', object: 'TABLE DATA', text: 'public.orders' })
  })

  it('drops catalog reads, notices and hints', () => {
    for (const line of [
      'pg_dump: reading publications',
      'pg_dump: saving encoding = UTF8',
      'pg_dump: creating SEQUENCE OWNED BY "public.orders_id_seq"',
      'NOTICE:  schema "public" already exists, skipping',
      'HINT:  Use DROP ... CASCADE to drop the dependent objects too.',
    ]) {
      expect(parseCopyLogLine(line)).toBeNull()
    }
  })

  it('keeps errors and their detail from either tool or the server', () => {
    expect(
      parseCopyLogLine(
        'ERROR:  cannot drop table public.orders because other objects depend on it'
      )
    ).toEqual({
      kind: 'error',
      object: null,
      text: 'cannot drop table public.orders because other objects depend on it',
    })
    expect(
      parseCopyLogLine(
        'DETAIL:  view public.orders_view depends on table public.orders'
      )?.kind
    ).toBe('detail')
    expect(
      parseCopyLogLine('pg_dump: error: connection to server failed')
    ).toEqual({
      kind: 'error',
      object: null,
      text: 'connection to server failed',
    })
  })

  it('shows a line it does not recognise rather than hide it', () => {
    expect(parseCopyLogLine('could not connect')?.kind).toBe('info')
  })
})

describe('appendCopyLog', () => {
  const failure = new Error(
    'ERROR:  cannot drop table public.orders\nDETAIL:  view public.orders_view depends on table public.orders'
  )
  const streamed = [
    'ERROR:  cannot drop table public.orders',
    'DETAIL:  view public.orders_view depends on table public.orders',
  ].flatMap((line) => parseCopyLogLine(line) ?? [])

  it('shows a failure once whichever way it arrives first', () => {
    const streamFirst = appendCopyLog(
      appendCopyLog([], streamed),
      toFailureEntries(failure)
    )
    const errorFirst = appendCopyLog(
      appendCopyLog([], toFailureEntries(failure)),
      streamed
    )
    for (const log of [streamFirst, errorFirst]) {
      expect(log.map(({ kind }) => kind)).toEqual(['error', 'detail'])
    }
  })

  it('logs an error the tools never printed', () => {
    expect(
      toFailureEntries(new Error('The target is the source database.'))
    ).toEqual([
      {
        kind: 'error',
        object: null,
        text: 'The target is the source database.',
      },
    ])
  })
})
