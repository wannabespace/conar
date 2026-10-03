import { describe, expect, it } from 'bun:test'

import { createPermix } from 'permix'

import type { Permissions } from './permissions'
import { permissionsOf, planOf } from './permissions'

const permixFor = (plan: Parameters<typeof permissionsOf>[0]) =>
  createPermix<Permissions>(permissionsOf(plan))

describe('planOf', () => {
  it('ranks an anonymous user as guest even with a subscription', () => {
    expect(planOf({ isAnonymous: true }, true)).toBe('guest')
    expect(planOf({ isAnonymous: false }, true)).toBe('pro')
    expect(planOf({ isAnonymous: null }, false)).toBe('free')
  })
})

describe('permissionsOf', () => {
  it('lets a guest create only the first connection', () => {
    const guest = permixFor('guest')

    expect(guest.check('connection.create', { count: 0 })).toBe(true)
    expect(guest.check('connection.create', { count: 1 })).toBe(false)
    expect(permixFor('free').check('connection.create', { count: 5 })).toBe(
      true
    )
  })

  it('keeps AI chat for pro and filters for every member', () => {
    expect(permixFor('pro').check('ai.chat')).toBe(true)
    expect(permixFor('free').check('ai.chat')).toBe(false)
    expect(permixFor('free').check('filter.ai')).toBe(true)
    expect(permixFor('guest').check('filter.ai')).toBe(false)
    expect(permixFor('guest').check('database.edit')).toBe(false)
  })
})
