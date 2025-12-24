import type { ConnectionFields } from '@conar/connection'
import type { DatabaseType } from '@conar/shared/enums/database-type'
import type { RefObject } from 'react'
import { buildConnectionString, parseConnectionString } from '@conar/connection'
import { placeholderMap } from '@conar/shared/utils/connections'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@conar/ui/components/card'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@conar/ui/components/tabs'
import { RiCodeLine, RiInputField } from '@remixicon/react'
import { useCallback, useId, useMemo, useRef, useState } from 'react'
import { CredentialsForm } from './credentials-form'

type CredentialsTab = 'string' | 'form'

export function StepCredentials({ ref, type, connectionString, setConnectionString, onEnter }: {
  ref: RefObject<HTMLInputElement | null>
  type: DatabaseType
  connectionString: string
  setConnectionString: (connectionString: string) => void
  onEnter: () => void
}) {
  const id = useId()
  const [activeTab, setActiveTab] = useState<CredentialsTab>('string')
  const [parseError, setParseError] = useState<string | null>(null)

  const lastChangeSource = useRef<'string' | 'form' | null>(null)

  const formFields = useMemo((): ConnectionFields => {
    if (!connectionString.trim()) {
      return { host: '', port: undefined, user: undefined, password: undefined, database: undefined, options: undefined }
    }

    try {
      const parsed = parseConnectionString(connectionString)
      setParseError(null)
      return {
        host: parsed.host,
        port: parsed.port,
        user: parsed.user,
        password: parsed.password,
        database: parsed.database,
        options: parsed.searchParams.toString() || undefined,
      }
    }
    catch (error) {
      if (lastChangeSource.current !== 'form')
        setParseError(error instanceof Error ? error.message : 'Invalid connection string')

      return { host: '', port: undefined, user: undefined, password: undefined, database: undefined, options: undefined }
    }
  }, [connectionString])

  const handleFieldChange = useCallback((field: keyof ConnectionFields, value: string) => {
    lastChangeSource.current = 'form'
    setParseError(null)

    const updatedFields: ConnectionFields = {
      ...formFields,
      [field]: value || undefined,
    }

    if (field === 'port') {
      updatedFields.port = value ? Number.parseInt(value, 10) : undefined
    }

    const newConnectionString = buildConnectionString(type, updatedFields)
    setConnectionString(newConnectionString)
  }, [formFields, type, setConnectionString])

  const handleStringChange = useCallback((value: string) => {
    lastChangeSource.current = 'string'
    setConnectionString(value)

    if (value.trim()) {
      try {
        parseConnectionString(value)
        setParseError(null)
      }
      catch (error) {
        setParseError(error instanceof Error ? error.message : 'Invalid connection string')
      }
    }
    else {
      setParseError(null)
    }
  }, [setConnectionString])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Credentials</CardTitle>
        <CardDescription>
          Enter your database credentials using a connection string or fill in the form fields.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as CredentialsTab)}>
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="string" className="flex-1 gap-2">
              <RiCodeLine className="size-4" />
              Connection String
            </TabsTrigger>
            <TabsTrigger value="form" className="flex-1 gap-2">
              <RiInputField className="size-4" />
              Form
            </TabsTrigger>
          </TabsList>

          <TabsContent value="string">
            <div className="flex flex-col gap-2">
              <Label htmlFor={id}>
                Connection string
              </Label>
              <Input
                id={id}
                placeholder={placeholderMap[type]}
                ref={ref}
                autoFocus
                value={connectionString}
                onChange={e => handleStringChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onEnter()
                  }
                }}
                aria-invalid={!!parseError}
              />
              {parseError && (
                <p className="text-sm text-destructive">
                  {parseError}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Paste your full connection string or switch to Form tab to enter fields individually.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="form">
            <CredentialsForm
              type={type}
              fields={formFields}
              onFieldChange={handleFieldChange}
              onEnter={onEnter}
            />
            {connectionString && (
              <div className="mt-4 p-3 bg-muted/50 rounded-md">
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Generated connection string:
                </Label>
                <code className="text-xs font-mono break-all text-foreground/80">
                  {connectionString.replace(/:[^:@]+@/, ':****@')}
                </code>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
