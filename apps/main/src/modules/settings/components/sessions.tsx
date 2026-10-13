import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@tamery/ui/components/alert-dialog'
import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import {
  SettingsGroup,
  SettingsRow,
} from '@tamery/ui/components/custom/settings-group'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { authClient } from '~/lib/auth'
import { orpc } from '~/lib/orpc'
import { handleError } from '~/utils/error'

import { SessionItem } from './session-item'

export const SessionsSettings = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { data: sessions, refetch: refetchSessions } = useSuspenseQuery(
    orpc.account.sessions.queryOptions()
  )

  const { mutate: revokeOtherSessions, isPending: revokingOthers } =
    useMutation({
      meta: { event: 'other_sessions_revoked' },
      mutationFn: async () => {
        const { error } = await authClient.revokeOtherSessions()

        if (error) {
          throw error
        }
      },
      onError: handleError,
      onSuccess: () => {
        refetchSessions()
        setIsOpen(false)
        toast.success('All other sessions have been revoked')
      },
    })

  return (
    <SettingsGroup title="Sessions">
      {sessions.map((session) => (
        <SessionItem
          key={session.id}
          {...session}
          refetchSessions={refetchSessions}
        />
      ))}
      {sessions.some((session) => !session.current) && (
        <SettingsRow
          title="Sign out other devices"
          description="Every session except this one ends right away."
        >
          <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
              Revoke all
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke all other sessions?</AlertDialogTitle>
                <AlertDialogDescription>
                  Every device except this one is signed out right away.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel variant="outline" size="default">
                  Cancel
                </AlertDialogCancel>
                <Button
                  variant="destructive"
                  disabled={revokingOthers}
                  onClick={() => revokeOtherSessions()}
                >
                  <LoadingContent loading={revokingOthers}>
                    Revoke all
                  </LoadingContent>
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SettingsRow>
      )}
    </SettingsGroup>
  )
}
