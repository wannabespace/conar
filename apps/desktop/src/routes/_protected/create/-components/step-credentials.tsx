import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { ConnectionFields } from '@conar/shared/utils/connections'
import type { DOMAttributes, RefObject } from 'react'
import { DATABASE_CONNECTION_CONFIG } from '@conar/shared/enums/database-type'
import {
  buildConnectionStringFromFields,
  parseConnectionStringToFields,
  placeholderMap,
} from '@conar/shared/utils/connections'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@conar/ui/components/tabs'
import { useId, useMemo, useState } from 'react'

interface StepCredentialsProps {
  ref: RefObject<HTMLInputElement | null>
  type: ConnectionType
  connectionString: string
  setConnectionString: (connectionString: string) => void
  onEnter: VoidFunction
}

export function StepCredentials({ ref, type, connectionString, setConnectionString, onEnter }: StepCredentialsProps) {
  const id = useId()
  const hostId = useId()
  const portId = useId()
  const userId = useId()
  const passwordId = useId()
  const databaseId = useId()
  const [activeTab, setActiveTab] = useState<'uri' | 'fields'>('uri')

  const fields = useMemo(
    () => parseConnectionStringToFields(connectionString, type),
    [connectionString, type],
  )

  const updateField = (field: keyof ConnectionFields, value: string) => {
    const newFields = { ...fields, [field]: value }
    setConnectionString(buildConnectionStringFromFields(newFields, type))
  }

  const handleFieldKeyDown: DOMAttributes<HTMLInputElement>['onKeyDown'] = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onEnter()
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'uri' | 'fields')}>
      <TabsList className="mb-4">
        <TabsTrigger value="uri">URI</TabsTrigger>
        <TabsTrigger value="fields">Fields</TabsTrigger>
      </TabsList>

      <TabsContent value="uri">
        <Label htmlFor={id} className="mb-2">
          URI
        </Label>
        <Input
          id={id}
          placeholder={placeholderMap[type]}
          ref={ref}
          autoFocus
          value={connectionString}
          onChange={e => setConnectionString(e.target.value)}
          onKeyDown={handleFieldKeyDown}
        />
      </TabsContent>

      <TabsContent value="fields">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={hostId} className="mb-2">
                Host
              </Label>
              <Input
                id={hostId}
                placeholder="localhost"
                autoFocus={activeTab === 'fields'}
                value={fields.host}
                onChange={e => updateField('host', e.target.value)}
                onKeyDown={handleFieldKeyDown}
              />
            </div>
            <div>
              <Label htmlFor={portId} className="mb-2">
                Port
              </Label>
              <Input
                id={portId}
                placeholder={DATABASE_CONNECTION_CONFIG[type].defaultPort}
                value={fields.port}
                onChange={e => updateField('port', e.target.value)}
                onKeyDown={handleFieldKeyDown}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={userId} className="mb-2">
                User
              </Label>
              <Input
                id={userId}
                placeholder="user"
                value={fields.user}
                onChange={e => updateField('user', e.target.value)}
                onKeyDown={handleFieldKeyDown}
              />
            </div>
            <div>
              <Label htmlFor={passwordId} className="mb-2">
                Password
              </Label>
              <Input
                id={passwordId}
                type="password"
                placeholder="password"
                value={fields.password}
                onChange={e => updateField('password', e.target.value)}
                onKeyDown={handleFieldKeyDown}
              />
            </div>
          </div>

          <div>
            <Label htmlFor={databaseId} className="mb-2">
              Database
            </Label>
            <Input
              id={databaseId}
              placeholder="database"
              value={fields.database}
              onChange={e => updateField('database', e.target.value)}
              onKeyDown={handleFieldKeyDown}
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
