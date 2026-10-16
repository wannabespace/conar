import { describe, expect, it } from 'bun:test'

import { sqliteTriggerParts } from './shape'

describe('sqliteTriggerParts', () => {
  it('reads timing, event and body past comments, quotes and IF NOT EXISTS', () => {
    expect(
      sqliteTriggerParts(`CREATE TRIGGER /* c */ IF NOT EXISTS main."after" -- x
INSTEAD OF DELETE ON "v" BEGIN DELETE FROM t; END`)
    ).toEqual({
      body: 'BEGIN DELETE FROM t; END',
      custom: false,
      event: 'DELETE',
      timing: 'INSTEAD OF',
    })
  })

  it('fires BEFORE when no timing is written', () => {
    expect(
      sqliteTriggerParts('CREATE TRIGGER t INSERT ON a BEGIN SELECT 1; END')
    ).toMatchObject({ event: 'INSERT', timing: 'BEFORE' })
  })

  it('marks UPDATE OF and WHEN as clauses the form cannot show', () => {
    for (const statement of [
      'CREATE TRIGGER t AFTER UPDATE OF b ON a BEGIN SELECT 1; END',
      'CREATE TRIGGER t AFTER INSERT ON a FOR EACH ROW WHEN new.b BEGIN SELECT 1; END',
    ]) {
      expect(sqliteTriggerParts(statement).custom).toBe(true)
    }
  })
})
