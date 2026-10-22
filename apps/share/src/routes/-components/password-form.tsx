import { SquareLock02Icon } from '@hugeicons/core-free-icons'
import { Button } from '@tamery/ui/components/button'
import { IconEmpty } from '@tamery/ui/components/custom/icon-empty'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { PasswordInput } from '@tamery/ui/components/custom/password-input'
import { EmptyContent } from '@tamery/ui/components/empty'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { useActionState, useId, useRef } from 'react'

import { posthog } from '~/lib/posthog'
import { SHARE_LOCKED, unlockShare } from '~/lib/share'

const route = getRouteApi('/$shareId')

export const PasswordForm = () => {
  const { shareId } = route.useParams()
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const errorId = useId()
  const [error, submit, pending] = useActionState(
    async (_previous: string | null, form: FormData) => {
      const unlocked = await unlockShare({
        id: shareId,
        password: String(form.get('password')),
      })
      void posthog.capture('share_unlocked', { success: unlocked.isOk() })
      if (unlocked.isOk()) {
        await router.invalidate()
        return null
      }
      input.current?.focus()
      return unlocked.error
    },
    null
  )

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <IconEmpty
        size="default"
        icon={SquareLock02Icon}
        title={SHARE_LOCKED}
        description={
          error ? (
            <span id={errorId} role="alert" className="text-destructive">
              {error}
            </span>
          ) : (
            'Ask the person who shared the link for it.'
          )
        }
      >
        <EmptyContent>
          <form action={submit} className="flex w-full max-w-xs gap-2">
            <PasswordInput
              ref={input}
              name="password"
              aria-label="Password"
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              autoComplete="current-password"
              autoFocus
              required
            />
            <Button type="submit" disabled={pending}>
              <LoadingContent loading={pending}>Open</LoadingContent>
            </Button>
          </form>
        </EmptyContent>
      </IconEmpty>
    </main>
  )
}
