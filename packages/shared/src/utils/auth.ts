import { type } from 'arktype'

const anonymousUserType = type({ isAnonymous: 'true' })

export function isAnonymousUser(user: unknown): user is { isAnonymous: true } {
  return !(anonymousUserType(user) instanceof type.errors)
}
