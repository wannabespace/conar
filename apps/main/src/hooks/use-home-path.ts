import { authClient } from '~/lib/auth'

export const useHomePath = () =>
  authClient.useSession().data?.user ? '/home' : '/'
