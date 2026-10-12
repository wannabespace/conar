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
import { Badge } from '@tamery/ui/components/badge'
import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import {
  SettingsGroup,
  SettingsRow,
} from '@tamery/ui/components/custom/settings-group'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { UAParser } from 'ua-parser-js'

import { authClient } from '~/lib/auth'
import { orpc } from '~/lib/orpc'
import { handleError } from '~/utils/error'

const electronAppNameRegex =
  /\s+(?<appName>[A-Za-z][\w.-]*)\/(?<appVersion>[\d.]+)\s+Chrome\//u

const getElectronAppName = (ua: string) => {
  const m = ua.match(electronAppNameRegex)
  const appName = m?.groups?.appName
  const appVersion = m?.groups?.appVersion
  return appName && appVersion ? `${appName} ${appVersion}` : null
}

const formatDeviceLabel = (ua: string) => {
  const parser = new UAParser(ua)
  const browser = parser.getBrowser()
  const os = parser.getOS()
  let osStr: string | null = null
  if (os.name && os.version) {
    osStr = `${os.name} ${os.version}`
  } else if (os.name) {
    osStr = os.name
  }
  if (browser.name === 'Electron') {
    const appName = getElectronAppName(ua)
    if (appName) {
      return osStr ? `${appName} on ${osStr}` : appName
    }
    return osStr ? `Electron on ${osStr}` : 'Electron'
  }
  const browserStr = browser.version
    ? `${browser.name} ${browser.version}`
    : browser.name
  if (!browserStr) {
    return osStr || 'Unknown device'
  }
  return osStr ? `${browserStr} on ${osStr}` : browserStr
}

const SessionItem = ({
  userAgent,
  ipAddress,
  token,
  currentToken,
  refetchSessions,
}: {
  userAgent?: string | null
  ipAddress?: string | null
  token: string
  currentToken?: string
  refetchSessions: () => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { mutate: revokeSession, isPending: revokingSession } = useMutation({
    mutationFn: async (sessionToken: string) => {
      const { error } = await authClient.revokeSession({ token: sessionToken })

      if (error) {
        throw error
      }
    },
    onError: handleError,
    onSuccess: () => {
      refetchSessions()
      setIsOpen(false)
      toast.success('Session revoked')
    },
  })

  return (
    <SettingsRow
      title={
        <span className="flex items-center gap-2">
          {userAgent ? formatDeviceLabel(userAgent) : 'Unknown device'}
          {token === currentToken && (
            <Badge variant="secondary">This device</Badge>
          )}
        </span>
      }
      description={ipAddress && <span data-mask>{ipAddress}</span>}
    >
      {token !== currentToken && (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
            Revoke
          </AlertDialogTrigger>
          <AlertDialogContent className="sm:max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke this session?</AlertDialogTitle>
              <AlertDialogDescription>
                The device is signed out right away.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel variant="outline" size="default">
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={revokingSession}
                onClick={() => revokeSession(token)}
              >
                <LoadingContent loading={revokingSession}>
                  Revoke
                </LoadingContent>
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </SettingsRow>
  )
}

export const SessionsSettings = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { data } = authClient.useSession()
  const currentToken = data?.session?.token

  const {
    data: sessions,
    isPending: sessionsPending,
    refetch: refetchSessions,
  } = useQuery(orpc.account.sessions.queryOptions())

  const { mutate: revokeOtherSessions, isPending: revokingOthers } =
    useMutation({
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

  const otherSessions = sessions?.filter((s) => s.token !== currentToken) ?? []

  return (
    <SettingsGroup title="Sessions">
      {sessionsPending ? (
        <SettingsRow title={<Skeleton className="h-4 w-48" />}>
          <Skeleton className="h-7 w-16 rounded-lg" />
        </SettingsRow>
      ) : (
        sessions?.map((session) => (
          <SessionItem
            key={session.id}
            userAgent={session.userAgent}
            ipAddress={session.ipAddress}
            token={session.token}
            currentToken={currentToken}
            refetchSessions={refetchSessions}
          />
        ))
      )}
      {otherSessions.length > 0 && (
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
