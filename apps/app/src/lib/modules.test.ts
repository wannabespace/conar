import { describe, expect, test } from 'bun:test'
import path from 'node:path'

import { moduleBoundaryViolations } from '@tamery/shared/module-boundaries'

describe('modules', () => {
  test('import only core and their own folder', () => {
    expect(
      moduleBoundaryViolations(path.resolve(import.meta.dir, '..'))
    ).toEqual([])
  })
})
