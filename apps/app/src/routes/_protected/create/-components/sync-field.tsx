import { SyncType } from '@tamery/shared/enums/sync-type'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'

import type { ConnectionForm } from '../-lib/connection-form'

const SYNC_OPTIONS: Record<SyncType, { description: string; label: string }> = {
  [SyncType.Cloud]: {
    description: 'Everything syncs, encrypted.',
    label: 'Full',
  },
  [SyncType.CloudWithoutPassword]: {
    description: 'Passwords and keys stay on this device.',
    label: 'No password',
  },
  [SyncType.CloudWithoutConnectionString]: {
    description: 'Only the name and color sync.',
    label: 'Metadata only',
  },
}

const SYNC_TYPES = Object.values(SyncType)

export const SyncField = ({ form }: { form: ConnectionForm }) => (
  <form.AppField name="syncType">
    {(field) => (
      <field.Field orientation="row">
        <field.Label>Sync</field.Label>
        <Select
          items={SYNC_TYPES.map((syncType) => ({
            label: SYNC_OPTIONS[syncType].label,
            value: syncType,
          }))}
          value={field.state.value}
          onValueChange={(next) => next && field.handleChange(next)}
        >
          <SelectTrigger id={field.name} variant="flat" className="flex-1">
            <SelectValue>
              {(syncType: SyncType) => (
                <>
                  {SYNC_OPTIONS[syncType].label}
                  <span className="text-muted-foreground truncate">
                    {SYNC_OPTIONS[syncType].description}
                  </span>
                </>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SYNC_TYPES.map((syncType) => (
              <SelectItem key={syncType} value={syncType}>
                <span className="flex flex-col">
                  {SYNC_OPTIONS[syncType].label}
                  <span className="text-muted-foreground text-xs">
                    {SYNC_OPTIONS[syncType].description}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </field.Field>
    )}
  </form.AppField>
)
