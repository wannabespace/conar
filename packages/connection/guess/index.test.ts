import { describe, expect, it } from 'bun:test'

import { guessConnection } from './index'

describe('guessConnection — unrecognised input', () => {
  it.each([
    [''],
    ['   '],
    ['p'],
    ['postgres:'],
    ['postgres://'],
    ['hello world'],
    ['{ "a": 1 }'],
    ['{ "broken": '],
    ['postgres://me@db.acme.io:99999/app'],
    ['postgres://me@db.acme.io/%E0%A4%A'],
  ])('returns null for %p', (text) => {
    expect(guessConnection(text)).toBeNull()
  })
})
