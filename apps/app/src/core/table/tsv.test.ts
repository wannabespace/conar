import { expect, test } from 'bun:test'

import { parseTsv, toTsv } from './tsv'

test('round-trips fields holding tabs, newlines and quotes', () => {
  const rows = [
    ['plain', 'tab\there', 'line\nbreak'],
    ['say "hi"', '', 'end'],
  ]
  expect(parseTsv(toTsv(rows))).toEqual(rows)
})

test('reads spreadsheet clipboard text with CRLF and a trailing newline', () => {
  expect(parseTsv('a\tb\r\nc\td\r\n')).toEqual([
    ['a', 'b'],
    ['c', 'd'],
  ])
})

test('keeps a single value as one cell', () => {
  expect(parseTsv('hello')).toEqual([['hello']])
})
