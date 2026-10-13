import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'

import type { ConnectionForm } from '../-lib/connection-form'

const ENGINES = Object.values(ConnectionType)

const ENGINE_LABELS: Record<ConnectionType, string> = {
  [ConnectionType.ClickHouse]: 'ClickHouse',
  [ConnectionType.MSSQL]: 'SQL Server',
  [ConnectionType.MySQL]: 'MySQL',
  [ConnectionType.Postgres]: 'PostgreSQL',
}

const EngineLabel = ({ type }: { type: ConnectionType }) => (
  <>
    <ConnectionIcon type={type} />
    {ENGINE_LABELS[type]}
  </>
)

export const EngineField = ({ form }: { form: ConnectionForm }) => (
  <form.AppField name="type">
    {(field) => (
      <field.Field orientation="row">
        <field.Label>Engine</field.Label>
        <Select
          items={ENGINES.map((type) => ({
            label: ENGINE_LABELS[type],
            value: type,
          }))}
          value={field.state.value}
          onValueChange={(next) => next && field.handleChange(next)}
        >
          <SelectTrigger id={field.name} variant="flat" className="flex-1">
            <SelectValue>
              {(type: ConnectionType) => <EngineLabel type={type} />}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ENGINES.map((type) => (
              <SelectItem key={type} value={type}>
                <EngineLabel type={type} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </field.Field>
    )}
  </form.AppField>
)
