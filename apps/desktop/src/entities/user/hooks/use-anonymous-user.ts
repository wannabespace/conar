import { authClient } from '~/lib/auth'

export function useAnonymousUser() {
  const { data } = authClient.useSession()
  return !!data?.user?.isAnonymous
}
