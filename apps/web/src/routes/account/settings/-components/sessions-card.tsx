import { AlertDialog, AlertDialogClose, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@conar/ui/components/alert-dialog'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from '@conar/ui/components/card'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Skeleton } from '@conar/ui/components/skeleton'
import { RiDeviceLine, RiLogoutCircleLine } from '@remixicon/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UAParser } from 'ua-parser-js'
import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

function getElectronAppName(ua: string) {
  const m = ua.match(/\s+([A-Za-z][\w.-]*)\/([\d.]+)\s+Chrome\//)
  return m ? `${m[1]} ${m[2]}` : null
}

function formatDeviceLabel(ua: string) {
  const parser = new UAParser(ua)
  const browser = parser.getBrowser()
  const os = parser.getOS()
  const osStr = os.name ? (os.version ? `${os.name} ${os.version}` : os.name) : null
  if (browser.name === 'Electron') {
    const appName = getElectronAppName(ua)
    if (appName)
      return osStr ? `${appName} on ${osStr}` : appName
    return osStr ? `Electron on ${osStr}` : 'Electron'
  }
  const browserStr = browser.version ? `${browser.name} ${browser.version}` : browser.name
  if (!browserStr)
    return osStr || 'Unknown device'
  return osStr ? `${browserStr} on ${osStr}` : browserStr
}

export function SessionsCard() {
  const { data } = authClient.useSession()
  const currentToken = data?.session?.token

  const { data: sessions, isPending: sessionsPending, refetch: refetchSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data, error } = await authClient.listSessions()

      if (error)
        throw error

      return data
    },
  })

  const { mutate: revokeSession, isPending: revokingSession } = useMutation({
    mutationFn: async (token: string) => {
      const { error } = await authClient.revokeSession({ token })

      if (error)
        throw error
    },
    onSuccess: () => {
      refetchSessions()
      toast.success('Session revoked')
    },
    onError: handleError,
  })

  const { mutate: revokeOtherSessions, isPending: revokingOthers } = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.revokeOtherSessions()

      if (error)
        throw error
    },
    onSuccess: () => {
      refetchSessions()
      toast.success('All other sessions have been revoked')
    },
    onError: handleError,
  })

  const otherSessions = sessions?.filter(s => s.token !== currentToken) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active sessions</CardTitle>
        <CardDescription>
          Manage devices where you're signed in. Revoking a session signs that device out.
        </CardDescription>
      </CardHeader>
      <CardPanel className="space-y-2">
        {sessionsPending
          ? (
              <>
                <Skeleton className="h-10 w-full rounded-lg border bg-muted/30" />
                <Skeleton className="h-10 w-full rounded-lg border bg-muted/30" />
              </>
            )
          : (
              <ul className="space-y-2">
                {sessions?.map(session => (
                  <li
                    key={session.id}
                    className="
                      flex items-center justify-between gap-4 rounded-lg border
                      bg-muted/30 px-3 py-2
                    "
                  >
                    <div className="flex items-center gap-3">
                      <RiDeviceLine className="size-4 text-muted-foreground" />
                      <div>
                        <p className="flex gap-2 text-sm font-medium">
                          {session.userAgent ? formatDeviceLabel(session.userAgent) : 'Unknown device'}
                          {session.token === currentToken && (
                            <Badge variant="outline">
                              This device
                            </Badge>
                          )}
                        </p>
                        {session.ipAddress && (
                          <p className="text-xs text-muted-foreground">{session.ipAddress}</p>
                        )}
                      </div>
                    </div>
                    {session.token !== currentToken && (
                      <AlertDialog>
                        <AlertDialogTrigger render={<Button variant="ghost" size="xs" />}>
                          <LoadingContent loading={revokingSession}>
                            Revoke
                          </LoadingContent>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="sm:max-w-sm">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Revoke this session?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will sign out this device. Are you sure you want to continue?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogClose render={<Button variant="outline" />}>
                              Cancel
                            </AlertDialogClose>
                            <AlertDialogClose
                              render={(
                                <Button
                                  variant="destructive"
                                  onClick={() => revokeSession(session.token)}
                                  disabled={revokingSession}
                                />
                              )}
                            >
                              <LoadingContent loading={revokingSession}>
                                Revoke
                              </LoadingContent>
                            </AlertDialogClose>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </li>
                ))}
              </ul>
            )}

        {otherSessions.length > 0 && (
          <AlertDialog>
            <div className="flex justify-end">
              <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
                <RiLogoutCircleLine className="size-4" />
                <LoadingContent loading={revokingOthers}>
                  Revoke all other sessions
                </LoadingContent>
              </AlertDialogTrigger>
            </div>
            <AlertDialogContent className="sm:max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Revoke all other sessions?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will sign out all devices except this one. Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogClose render={<Button variant="outline" />}>
                  Cancel
                </AlertDialogClose>
                <AlertDialogClose
                  render={(
                    <Button
                      variant="destructive"
                      onClick={() => revokeOtherSessions()}
                      disabled={revokingOthers}
                    />
                  )}
                >
                  <LoadingContent loading={revokingOthers}>
                    Revoke other
                  </LoadingContent>
                </AlertDialogClose>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardPanel>
    </Card>
  )
}
