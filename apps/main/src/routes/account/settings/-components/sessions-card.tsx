import {
  LogoutCircle01Icon,
  SmartPhone01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tamery/ui/components/card'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { UAParser } from 'ua-parser-js'

import { authClient } from '~/lib/auth'
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
    onSuccess: () => {
      refetchSessions()
      setIsOpen(false)
      toast.success('Session revoked')
    },
    onError: handleError,
  })

  return (
    <li className="bg-muted/30 flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
      <div className="flex items-center gap-3">
        <HugeiconsIcon
          icon={SmartPhone01Icon}
          strokeWidth={2}
          className="text-muted-foreground size-4"
        />
        <div>
          <p className="flex gap-2 text-sm font-medium">
            {userAgent ? formatDeviceLabel(userAgent) : 'Unknown device'}
            {token === currentToken && (
              <Badge variant="outline">This device</Badge>
            )}
          </p>
          {ipAddress && (
            <p className="text-muted-foreground text-xs">{ipAddress}</p>
          )}
        </div>
      </div>
      {token !== currentToken && (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogTrigger render={<Button variant="ghost" size="xs" />}>
            Revoke
          </AlertDialogTrigger>
          <AlertDialogContent className="sm:max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke this session?</AlertDialogTitle>
              <AlertDialogDescription>
                This will sign out this device. Are you sure you want to
                continue?
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
    </li>
  )
}

export const SessionsCard = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { data } = authClient.useSession()
  const currentToken = data?.session?.token

  const {
    data: sessions,
    isPending: sessionsPending,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data: sessionsList, error } = await authClient.listSessions()

      if (error) {
        throw error
      }

      return sessionsList
    },
  })

  const { mutate: revokeOtherSessions, isPending: revokingOthers } =
    useMutation({
      mutationFn: async () => {
        const { error } = await authClient.revokeOtherSessions()

        if (error) {
          throw error
        }
      },
      onSuccess: () => {
        refetchSessions()
        setIsOpen(false)
        toast.success('All other sessions have been revoked')
      },
      onError: handleError,
    })

  const otherSessions = sessions?.filter((s) => s.token !== currentToken) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active sessions</CardTitle>
        <CardDescription>
          Manage devices where you&apos;re signed in. Revoking a session signs
          that device out.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessionsPending ? (
          <>
            <Skeleton className="bg-muted/30 h-10 w-full rounded-lg border" />
            <Skeleton className="bg-muted/30 h-10 w-full rounded-lg border" />
          </>
        ) : (
          <ul className="space-y-2">
            {sessions?.map((session) => (
              <SessionItem
                key={session.id}
                userAgent={session.userAgent}
                ipAddress={session.ipAddress}
                token={session.token}
                currentToken={currentToken}
                refetchSessions={refetchSessions}
              />
            ))}
          </ul>
        )}

        {otherSessions.length > 0 && (
          <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex justify-end">
              <AlertDialogTrigger
                render={<Button variant="outline" size="sm" />}
              >
                <HugeiconsIcon
                  icon={LogoutCircle01Icon}
                  strokeWidth={2}
                  className="size-4"
                />
                Revoke all other sessions
              </AlertDialogTrigger>
            </div>
            <AlertDialogContent className="sm:max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke all other sessions?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will sign out all devices except this one. Are you sure
                  you want to continue?
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
                    Revoke other
                  </LoadingContent>
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  )
}
