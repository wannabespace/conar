import type { User } from 'better-auth'

type AuthUser = User & { isAnonymous?: boolean | null }

export function isAnonymousUser(user: AuthUser | null | undefined): user is User & { isAnonymous: true } {
  return !!user && user.isAnonymous === true
}
