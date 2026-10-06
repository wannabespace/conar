import { expect, test } from 'bun:test'

import { inlineValues } from './run'

const escape = (value: unknown) => `'${String(value)}'`

test('a question mark inside quotes keeps the values in order', () => {
  expect(
    inlineValues(
      "select concat('why?', ?), `a?b` from t where id = ?",
      ['x', 1],
      escape
    )
  ).toBe("select concat('why?', 'x'), `a?b` from t where id = '1'")
})
