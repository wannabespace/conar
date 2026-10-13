import { authClient } from '~/lib/auth'

// `/` redirects signed-in users to `/account`, so their landing-page links go to `/home`.
export const useHomePath = () =>
  authClient.useSession().data?.user ? '/home' : '/'
