import { describe, expect, it } from 'bun:test'

import { createPermix } from 'permix'

import type { Permissions } from './permissions'
import { permissionsOf } from './permissions'

const guest = createPermix<Permissions>(
  permissionsOf({ subscription: null, user: { isAnonymous: true } })
)
const free = createPermix<Permissions>(
  permissionsOf({ subscription: null, user: { isAnonymous: false } })
)
const pro = createPermix<Permissions>(
  permissionsOf({ subscription: { plan: 'pro' }, user: { isAnonymous: false } })
)

describe('permissionsOf', () => {
  it('treats an anonymous user as guest even with a subscription', () => {
    const subscribedGuest = createPermix<Permissions>(
      permissionsOf({
        subscription: { plan: 'pro' },
        user: { isAnonymous: true },
      })
    )

    expect(subscribedGuest.check('ai.chat.use')).toBe(false)
    expect(subscribedGuest.check('database.edit')).toBe(false)
  })

  it('lets a guest create only the first connection', () => {
    expect(guest.check('connection.create', { count: 0 })).toBe(true)
    expect(guest.check('connection.create', { count: 1 })).toBe(false)
    expect(free.check('connection.create', { count: 5 })).toBe(true)
  })

  it('keeps AI chat for pro and filters for every member', () => {
    expect(pro.check('ai.chat.use')).toBe(true)
    expect(free.check('ai.chat.use')).toBe(false)
    expect(free.check('ai.filter.use')).toBe(true)
    expect(guest.check('ai.filter.use')).toBe(false)
    expect(guest.check('database.edit')).toBe(false)
  })
})
