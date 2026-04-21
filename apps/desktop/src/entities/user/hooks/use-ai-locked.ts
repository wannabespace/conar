import { useAnonymousUser } from './use-anonymous-user'
import { useSubscription } from './use-subscription'

export function useAiLocked() {
  const isAnonymous = useAnonymousUser()
  const { subscription } = useSubscription()
  return { isAiLocked: isAnonymous || !subscription, isAnonymous }
}
