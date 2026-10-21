import { SquareLock02Icon } from '@hugeicons/core-free-icons'
import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { PasswordInput } from '@tamery/ui/components/custom/password-input'
import { EmptyContent } from '@tamery/ui/components/empty'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useActionState } from 'react'

import { posthog } from '~/lib/posthog'
import { unlockShare } from '~/lib/share'
import { shareRowsQueryKey } from '~/lib/share-rows'

import { EmptyState } from './empty-state'

export const PasswordForm = ({
  message,
  shareId,
}: {
  message: string | null
  shareId: string
}) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, submit, pending] = useActionState(
    async (_previous: string | null, form: FormData) => {
      const refused = await unlockShare({
        id: shareId,
        password: String(form.get('password')),
      })
      void posthog.capture('share_unlocked', { success: !refused })
      if (!refused) {
        await queryClient.invalidateQueries({
          queryKey: shareRowsQueryKey(shareId),
        })
        await router.invalidate()
      }
      return refused
    },
    message
  )

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <EmptyState
        icon={SquareLock02Icon}
        title="This table needs a password"
        description={
          error ? (
            <span className="text-destructive">{error}</span>
          ) : (
            'Ask the person who shared the link for it.'
          )
        }
      >
        <EmptyContent>
          <form action={submit} className="flex w-full max-w-xs gap-2">
            <PasswordInput
              name="password"
              aria-label="Password"
              aria-invalid={!!error}
              autoComplete="current-password"
              autoFocus
              required
            />
            <Button type="submit" disabled={pending}>
              <LoadingContent loading={pending}>Open</LoadingContent>
            </Button>
          </form>
        </EmptyContent>
      </EmptyState>
    </main>
  )
}
