import { describe, expect, it } from 'bun:test'

import { oracleRoutineParts } from './shape'

describe('oracleRoutineParts', () => {
  it('splits the stored header into arguments, return type, options and body', () => {
    expect(
      oracleRoutineParts(`FUNCTION "f" (x NUMBER,
  y VARCHAR2) RETURN NUMBER DETERMINISTIC IS
BEGIN
  RETURN x;
END;`)
    ).toEqual({
      args: 'x NUMBER, y VARCHAR2',
      body: 'BEGIN\n  RETURN x;\nEND;',
      extras: 'DETERMINISTIC',
      returnType: 'NUMBER',
    })
  })

  it('reads a schema-qualified name', () => {
    expect(
      oracleRoutineParts('PROCEDURE "S"."p" (x IN NUMBER) AS BEGIN NULL; END;')
    ).toEqual({
      args: 'x IN NUMBER',
      body: 'BEGIN NULL; END;',
      extras: '',
      returnType: null,
    })
  })

  it('takes a routine without parentheses', () => {
    expect(
      oracleRoutineParts('FUNCTION f RETURN NUMBER IS BEGIN RETURN 1; END;')
    ).toMatchObject({ args: '', returnType: 'NUMBER' })
  })

  it('reads wrapped source as nothing', () => {
    expect(oracleRoutineParts('FUNCTION f wrapped a000000')).toBeNull()
  })
})
