import { SquareLock02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { PasswordInput } from '@tamery/ui/components/custom/password-input'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useActionState } from 'react'

import { posthog } from '~/lib/posthog'
import { unlockShare } from '~/lib/share'
import { shareRowsQueryKey } from '~/lib/share-rows'

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
        data: { id: shareId, password: String(form.get('password')) },
      })
      void posthog.capture('share_unlocked', { success: !refused })
      if (!refused) {
        queryClient.removeQueries({ queryKey: shareRowsQueryKey(shareId) })
        await router.invalidate()
      }
      return refused
    },
    message
  )

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-4 text-center">
      <HugeiconsIcon
        icon={SquareLock02Icon}
        strokeWidth={2}
        className="text-muted-foreground size-8"
      />
      <h1 className="text-2xl font-semibold tracking-tight text-balance">
        This table needs a password
      </h1>
      <p className="text-muted-foreground max-w-sm text-sm text-balance">
        Ask the person who shared the link for it.
      </p>
      <form action={submit} className="flex w-full max-w-xs flex-col gap-2">
        <div className="flex gap-2">
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
        </div>
        {error && <p className="text-destructive text-left text-xs">{error}</p>}
      </form>
    </main>
  )
}
