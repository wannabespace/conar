import type { RefObject } from 'react'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { placeholderMap } from '@conar/shared/utils/connections'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { Button } from '@conar/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@conar/ui/components/card'
import { Collapsible, CollapsibleContent } from '@conar/ui/components/collapsible'
import { Field, FieldDescription, FieldLabel } from '@conar/ui/components/field'
import { Group } from '@conar/ui/components/group'
import { Input } from '@conar/ui/components/input'
import { Switch } from '@conar/ui/components/switch'
import { useId, useMemo } from 'react'

const SSH_AUTH_OPTIONS = ['key', 'password', 'agent'] as const
type SshAuthOption = typeof SSH_AUTH_OPTIONS[number]

const SSH_PARAM_KEYS = [
  'ssh_host',
  'ssh_port',
  'ssh_user',
  'ssh_auth',
  'ssh_password',
  'ssh_private_key',
  'ssh_private_key_path',
  'ssh_passphrase',
] as const

const PARSEABLE_FALLBACK: Record<ConnectionType, string> = {
  [ConnectionType.Postgres]: 'postgresql://user:password@host:5432/database',
  [ConnectionType.MySQL]: 'mysql://user:password@host:3306/database',
  [ConnectionType.MSSQL]: 'sqlserver://user:password@host:1433/database',
  [ConnectionType.ClickHouse]: 'https://user:password@host:8443',
}

function safeParse(input: string): SafeURL | null {
  try {
    return new SafeURL(input)
  }
  catch {
    return null
  }
}

function useSshForm({
  type,
  connectionString,
  setConnectionString,
}: {
  type: ConnectionType
  connectionString: string
  setConnectionString: (next: string) => void
}) {
  const baseString = connectionString || PARSEABLE_FALLBACK[type]
  const parsed = useMemo(() => safeParse(baseString), [baseString])

  const authRaw = parsed?.searchParams.get('ssh_auth')
  const auth: SshAuthOption = SSH_AUTH_OPTIONS.find(opt => opt === authRaw) ?? 'key'

  const patch = (mut: (u: SafeURL) => void) => {
    if (!parsed)
      return
    const next = new SafeURL(baseString)
    mut(next)
    setConnectionString(next.toString())
  }

  const setParam = (key: string, value: string) => patch((u) => {
    if (value === '') {
      u.searchParams.delete(key)
    }
    else {
      u.searchParams.set(key, value)
    }
  })

  const setAuth = (next: SshAuthOption) => patch(u => u.searchParams.set('ssh_auth', next))

  const toggle = (open: boolean) => {
    patch((u) => {
      if (open) {
        u.searchParams.set('ssh_host', '')
        if (!u.searchParams.has('ssh_port'))
          u.searchParams.set('ssh_port', '22')
        if (!u.searchParams.has('ssh_user'))
          u.searchParams.set('ssh_user', '')
        if (!u.searchParams.has('ssh_auth'))
          u.searchParams.set('ssh_auth', 'password')
      }
      else {
        for (const key of SSH_PARAM_KEYS) {
          u.searchParams.delete(key)
        }
      }
    })
  }

  return {
    on: parsed?.searchParams.has('ssh_host') ?? false,
    host: parsed?.searchParams.get('ssh_host') ?? '',
    port: parsed?.searchParams.get('ssh_port') ?? '',
    user: parsed?.searchParams.get('ssh_user') ?? '',
    auth,
    privateKeyPath: parsed?.searchParams.get('ssh_private_key_path') ?? '',
    passphrase: parsed?.searchParams.get('ssh_passphrase') ?? '',
    password: parsed?.searchParams.get('ssh_password') ?? '',
    setParam,
    setAuth,
    toggle,
  }
}

export function StepCredentials({
  ref,
  type,
  connectionString,
  setConnectionString,
  onEnter,
}: {
  ref: RefObject<HTMLInputElement | null>
  type: ConnectionType
  connectionString: string
  setConnectionString: (connectionString: string) => void
  onEnter: () => void
}) {
  const id = useId()
  const sshToggleId = useId()
  const sshHostId = useId()
  const sshPortId = useId()
  const sshUserId = useId()
  const sshKeyPathId = useId()
  const sshPassphraseId = useId()
  const sshPasswordId = useId()

  const ssh = useSshForm({ type, connectionString, setConnectionString })

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Credentials</CardTitle>
        <CardDescription>Enter the credentials of your connection.</CardDescription>
      </CardHeader>
      <CardContent>
        <Field className="gap-2">
          <FieldLabel htmlFor={id}>
            Connection string
          </FieldLabel>
          <Input
            id={id}
            placeholder={placeholderMap[type]}
            ref={ref}
            autoFocus
            value={connectionString}
            onChange={e => setConnectionString(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onEnter()
              }
            }}
          />
          {!window.electron && (
            <FieldDescription>
              The web app cannot query local connections
            </FieldDescription>
          )}
        </Field>

        {window.electron && (
          <div className="mt-6 flex flex-col gap-4">
            <label
              htmlFor={sshToggleId}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Switch
                id={sshToggleId}
                checked={ssh.on}
                onCheckedChange={ssh.toggle}
              />
              Use SSH tunnel
            </label>

            <Collapsible open={ssh.on}>
              <CollapsibleContent className="flex flex-col gap-4 pt-2">
                <Field className="gap-2">
                  <FieldLabel htmlFor={sshHostId}>
                    SSH Host
                  </FieldLabel>
                  <Input
                    id={sshHostId}
                    placeholder="bastion.example.com"
                    value={ssh.host}
                    onChange={e => ssh.setParam('ssh_host', e.target.value)}
                  />
                </Field>
                <Field className="gap-2">
                  <FieldLabel htmlFor={sshPortId}>
                    SSH Port
                  </FieldLabel>
                  <Input
                    id={sshPortId}
                    type="number"
                    placeholder="22"
                    value={ssh.port}
                    onChange={e => ssh.setParam('ssh_port', e.target.value)}
                  />
                </Field>
                <Field className="gap-2">
                  <FieldLabel htmlFor={sshUserId}>
                    SSH User
                  </FieldLabel>
                  <Input
                    id={sshUserId}
                    placeholder="ubuntu"
                    value={ssh.user}
                    onChange={e => ssh.setParam('ssh_user', e.target.value)}
                  />
                </Field>
                <Field className="gap-2">
                  <FieldLabel>
                    Authentication
                  </FieldLabel>
                  <Group>
                    {SSH_AUTH_OPTIONS.map(option => (
                      <Button
                        key={option}
                        type="button"
                        variant={ssh.auth === option ? 'default' : 'outline'}
                        size="xs"
                        onClick={() => ssh.setAuth(option)}
                        className="border!"
                      >
                        {option}
                      </Button>
                    ))}
                  </Group>
                </Field>

                {ssh.auth === 'key' && (
                  <>
                    <Field className="gap-2">
                      <FieldLabel htmlFor={sshKeyPathId}>
                        Private Key Path
                      </FieldLabel>
                      <Input
                        id={sshKeyPathId}
                        placeholder="~/.ssh/id_rsa"
                        value={ssh.privateKeyPath}
                        onChange={e => ssh.setParam('ssh_private_key_path', e.target.value)}
                      />
                    </Field>
                    <Field className="gap-2">
                      <FieldLabel htmlFor={sshPassphraseId}>
                        Passphrase
                        {' '}
                        <span className="text-xs text-muted-foreground/50">(optional)</span>
                      </FieldLabel>
                      <Input
                        id={sshPassphraseId}
                        type="password"
                        value={ssh.passphrase}
                        onChange={e => ssh.setParam('ssh_passphrase', e.target.value)}
                      />
                    </Field>
                  </>
                )}

                {ssh.auth === 'password' && (
                  <Field className="gap-2">
                    <FieldLabel htmlFor={sshPasswordId}>
                      Password
                    </FieldLabel>
                    <Input
                      id={sshPasswordId}
                      type="password"
                      value={ssh.password}
                      onChange={e => ssh.setParam('ssh_password', e.target.value)}
                    />
                  </Field>
                )}

                {ssh.auth === 'agent' && (
                  <FieldDescription>
                    Will use SSH_AUTH_SOCK from environment.
                  </FieldDescription>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
