import { expect, test } from 'bun:test'

import { bytesToHex, hexToBytes, valueToText } from './value-text'

test('bytes round-trip through hex', () => {
  const bytes = new Uint8Array([0xde, 0xad, 0x00, 0x0f])
  expect(bytesToHex(bytes)).toBe('0xDEAD000F')
  expect(hexToBytes(bytesToHex(bytes))).toEqual(bytes)
})

test('bytes read as hex, alone and nested', () => {
  const bytes = new Uint8Array([0xbe, 0xef])
  expect(valueToText(bytes)).toBe('0xBEEF')
  expect(valueToText([{ data: bytes }])).toBe('[{"data":"0xBEEF"}]')
})

test('null, dates and scalars read as plain text', () => {
  expect(valueToText(null)).toBe('')
  expect(valueToText(new Date(0))).toBe('1970-01-01T00:00:00.000Z')
  expect(valueToText(10n)).toBe('10')
})
