import type { KeyboardEvent, RefObject } from 'react'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { placeholderMap } from '@conar/shared/utils/connections'
import { tryCatch } from '@conar/shared/utils/helpers'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@conar/ui/components/card'
import { Field, FieldDescription, FieldLabel } from '@conar/ui/components/field'
import { Input } from '@conar/ui/components/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@conar/ui/components/tabs'
import { useEffect, useId, useState } from 'react'
import { useLocalProxyAvailable } from '~/entities/connection/proxy'

interface ConnectionFields {
  host: string
  port: string
  user: string
  password: string
  database: string
  search?: string
  hash?: string
}

const DEFAULT_PORTS: Record<ConnectionType, string> = {
  [ConnectionType.Postgres]: '5432',
  [ConnectionType.MySQL]: '3306',
  [ConnectionType.MSSQL]: '1433',
  [ConnectionType.ClickHouse]: '8123',
}

const PROTOCOLS: Record<ConnectionType, string> = {
  [ConnectionType.Postgres]: 'postgresql',
  [ConnectionType.MySQL]: 'mysql',
  [ConnectionType.MSSQL]: 'sqlserver',
  [ConnectionType.ClickHouse]: 'https',
}

function safeDecode(str: string): string {
  try {
    return decodeURIComponent(str)
  }
  catch {
    return str
  }
}

function parseConnection(str: string): ConnectionFields {
  const result = tryCatch(() => new SafeURL(str.trim())).data
  if (!result)
    return { host: '', port: '', user: '', password: '', database: '', search: '', hash: '' }

  let database = ''
  if (result.pathname && result.pathname !== '/') {
    database = result.pathname.slice(1)
  }

  return {
    host: result.hostname || '',
    port: result.port || '',
    user: safeDecode(result.username || ''),
    password: safeDecode(result.password || ''),
    database: safeDecode(database),
    search: result.search || '',
    hash: result.hash || '',
  }
}

function constructConnectionString(fields: ConnectionFields, type: ConnectionType): string {
  const { host, port, user, password, database, search = '', hash = '' } = fields
  const protocol = PROTOCOLS[type] || 'postgresql'

  const url = new SafeURL(`${protocol}://${host || 'localhost'}`)
  if (port) {
    url.port = port
  }
  url.username = user
  url.password = password

  if (database) {
    url.pathname = database
  }
  else if (type !== ConnectionType.ClickHouse) {
    url.pathname = '/'
  }

  url.search = search
  url.hash = hash

  return url.toString()
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
  const localProxyAvailable = useLocalProxyAvailable()
  const [activeTab, setActiveTab] = useState<'uri' | 'parameters'>('uri')

  const [host, setHost] = useState('')
  const [port, setPort] = useState('')
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [database, setDatabase] = useState('')
  const [search, setSearch] = useState('')
  const [hash, setHash] = useState('')

  const handleTabChange = (value: string) => {
    const nextTab = value as 'uri' | 'parameters'
    setActiveTab(nextTab)

    if (nextTab === 'parameters') {
      const parsed = parseConnection(connectionString)
      setHost(parsed.host)
      setPort(parsed.port || DEFAULT_PORTS[type] || '')
      setUser(parsed.user)
      setPassword(parsed.password)
      setDatabase(parsed.database)
      setSearch(parsed.search || '')
      setHash(parsed.hash || '')
    }
  }

  useEffect(() => {
    if (activeTab === 'parameters') {
      const newConnectionString = constructConnectionString({
        host,
        port,
        user,
        password,
        database,
        search,
        hash,
      }, type)
      setConnectionString(newConnectionString)
    }
  }, [host, port, user, password, database, search, hash, type, activeTab, setConnectionString])

  const handleEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onEnter()
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Credentials</CardTitle>
        <CardDescription>Enter the credentials of your connection.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex w-full flex-col gap-4"
        >
          <TabsList className="mb-2">
            <TabsTrigger value="uri">URI</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
          </TabsList>

          <TabsContent value="uri">
            <Field className="w-full gap-2">
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
                onKeyDown={handleEnter}
              />
              {!window.electron && (
                <FieldDescription>
                  {localProxyAvailable
                    ? 'Local connections will be routed through your conar proxy.'
                    : 'Run `conar proxy` to query local connections from the web.'}
                </FieldDescription>
              )}
            </Field>
          </TabsContent>

          <TabsContent value="parameters" className="w-full">
            <div className={`
              grid w-full grid-cols-1 gap-4
              sm:grid-cols-6
            `}
            >
              <Field className={`
                col-span-1 gap-2
                sm:col-span-4
              `}
              >
                <FieldLabel htmlFor={`${id}-host`}>
                  Host
                </FieldLabel>
                <Input
                  id={`${id}-host`}
                  placeholder="127.0.0.1"
                  value={host}
                  onChange={e => setHost(e.target.value)}
                  onKeyDown={handleEnter}
                />
              </Field>

              <Field className={`
                col-span-1 gap-2
                sm:col-span-2
              `}
              >
                <FieldLabel htmlFor={`${id}-port`}>
                  Port
                </FieldLabel>
                <Input
                  id={`${id}-port`}
                  placeholder={DEFAULT_PORTS[type] || '5432'}
                  value={port}
                  onChange={e => setPort(e.target.value)}
                  onKeyDown={handleEnter}
                />
              </Field>

              <Field className={`
                col-span-1 gap-2
                sm:col-span-3
              `}
              >
                <FieldLabel htmlFor={`${id}-user`}>
                  Username
                </FieldLabel>
                <Input
                  id={`${id}-user`}
                  placeholder="postgres"
                  value={user}
                  onChange={e => setUser(e.target.value)}
                  onKeyDown={handleEnter}
                />
              </Field>

              <Field className={`
                col-span-1 gap-2
                sm:col-span-3
              `}
              >
                <FieldLabel htmlFor={`${id}-password`}>
                  Password
                </FieldLabel>
                <Input
                  id={`${id}-password`}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleEnter}
                />
              </Field>

              <Field className={`
                col-span-1 gap-2
                sm:col-span-6
              `}
              >
                <FieldLabel htmlFor={`${id}-database`}>
                  Database
                  {' '}
                  <span className="text-xs text-muted-foreground/50">(optional)</span>
                </FieldLabel>
                <Input
                  id={`${id}-database`}
                  placeholder="postgres"
                  value={database}
                  onChange={e => setDatabase(e.target.value)}
                  onKeyDown={handleEnter}
                />
              </Field>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
