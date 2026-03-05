import type { User } from 'better-auth'
import { type } from 'arktype'

const anonymousUserType = type({ isAnonymous: 'true' })

export type AuthUser = (User & { isAnonymous?: boolean | null }) | undefined
export type AnonymousUser = User & typeof anonymousUserType.infer

export function isAnonymousUser(user: AuthUser): user is AnonymousUser {
  return Boolean(user) && !(anonymousUserType(user) instanceof type.errors)
}
