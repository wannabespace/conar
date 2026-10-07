import { describe, expect, test } from 'bun:test'

import { clickhouseEnum, mysqlEnum } from './inline-enum'

const loaded = (values: string[]) =>
  values.map((value) => ({ origin: value, value }))

describe('mysqlEnum', () => {
  test('respells an unchanged catalog type exactly', () => {
    const catalog =
      "enum('draft','it''s','a\\\\b','line\\nbreak','',' padded ')"
    const values = mysqlEnum.parse(catalog) ?? []

    expect(values).toEqual([
      'draft',
      "it's",
      'a\\b',
      'line\nbreak',
      '',
      ' padded ',
    ])
    expect(mysqlEnum.spell(loaded(values), catalog)).toBe(catalog)
  })

  test('reads only enum types', () => {
    expect(mysqlEnum.parse("set('a','b')")).toBeNull()
    expect(mysqlEnum.parse('varchar(255)')).toBeNull()
  })
})

describe('clickhouseEnum', () => {
  test('respells an unchanged catalog type exactly', () => {
    const catalog = "Enum8('' = 0, 'it\\'s' = 5, 'a\\nb' = 6, 'c\\\\d' = 7)"
    const values = clickhouseEnum.parse(catalog) ?? []

    expect(values).toEqual(['', "it's", 'a\nb', 'c\\d'])
    expect(clickhouseEnum.spell(loaded(values), catalog)).toBe(catalog)
  })

  test('keeps stored numbers, numbers new values above them, lists by number', () => {
    expect(
      clickhouseEnum.spell(
        [{ value: 'c' }, { origin: 'b', value: 'b' }, { value: 'd' }],
        "Enum8('a' = 1, 'b' = 7)"
      )
    ).toBe("Enum8('b' = 7, 'c' = 8, 'd' = 9)")
  })

  test('keeps the stored number of a renamed value', () => {
    expect(
      clickhouseEnum.spell(
        [{ origin: 'done', value: 'finished' }],
        "Enum8('draft' = 1, 'done' = 2)"
      )
    ).toBe("Enum8('finished' = 2)")
  })

  test('widens to Enum16 past the Enum8 range', () => {
    expect(
      clickhouseEnum.spell(
        [{ origin: 'a', value: 'a' }, { value: 'b' }],
        "Enum8('a' = 127)"
      )
    ).toBe("Enum16('a' = 127, 'b' = 128)")
  })

  test('keeps a declared Enum16', () => {
    const catalog = "Enum16('a' = 1)"

    expect(clickhouseEnum.spell(loaded(['a']), catalog)).toBe(catalog)
  })
})
