import { describe, expect, it } from 'bun:test'

import { guessConnection } from './index'

describe('guessConnection — provider fixes', () => {
  it("moves Supabase's transaction pooler to session mode and drops Prisma's own params", () => {
    const guess = guessConnection(
      'DATABASE_URL="postgresql://postgres.abcd:pw@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"'
    )
    expect(guess?.fixes).toStrictEqual(['session-pooler'])
    expect(guess?.parts).toMatchObject({
      host: 'aws-0-eu-central-1.pooler.supabase.com',
      port: '5432',
      user: 'postgres.abcd',
    })
    expect(guess?.parts.options).toBeUndefined()
  })

  it('clears the password placeholder Supabase puts in its strings', () => {
    const guess = guessConnection(
      'postgresql://postgres:[YOUR-PASSWORD]@db.abcd.supabase.co:5432/postgres'
    )
    expect(guess?.fixes).toStrictEqual([])
    expect(guess?.parts.password).toBeUndefined()
  })

  it("uses Neon's direct endpoint instead of its pooler", () => {
    const guess = guessConnection(
      'postgresql://me:pw@ep-cool-name-123456-pooler.eu-central-1.aws.neon.tech/app?sslmode=require'
    )
    expect(guess?.fixes).toStrictEqual(['neon-direct'])
    expect(guess?.parts.host).toBe(
      'ep-cool-name-123456.eu-central-1.aws.neon.tech'
    )
  })

  it('leaves a session-mode string alone', () => {
    expect(
      guessConnection(
        'postgresql://postgres.abcd:pw@aws-0-eu-central-1.pooler.supabase.com:5432/postgres'
      )?.fixes
    ).toStrictEqual([])
  })
})
