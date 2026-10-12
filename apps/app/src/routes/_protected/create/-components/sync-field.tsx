import { SyncType } from '@tamery/shared/enums/sync-type'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@tamery/ui/components/field'
import { RadioGroup, RadioGroupItem } from '@tamery/ui/components/radio-group'

import type { ConnectionForm } from '../-lib/connection-form'

const SYNC_OPTIONS: Record<SyncType, { description: string; label: string }> = {
  [SyncType.Cloud]: {
    description: 'Everything syncs, encrypted.',
    label: 'Full',
  },
  [SyncType.CloudWithoutPassword]: {
    description: 'Passwords and keys stay on each device.',
    label: 'No password',
  },
  [SyncType.CloudWithoutConnectionString]: {
    description: 'Only the name and color sync.',
    label: 'Metadata only',
  },
}

export const SyncField = ({ form }: { form: ConnectionForm }) => (
  <FieldSet>
    <FieldLegend variant="label" className="ml-3">
      Sync
    </FieldLegend>
    <form.AppField name="syncType">
      {(field) => (
        <RadioGroup
          aria-label="Sync"
          className="grid-cols-3"
          value={field.state.value}
          onValueChange={field.handleChange}
        >
          {Object.values(SyncType).map((syncType) => (
            <FieldLabel key={syncType} htmlFor={`sync-${syncType}`}>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>{SYNC_OPTIONS[syncType].label}</FieldTitle>
                  <FieldDescription size="sm">
                    {SYNC_OPTIONS[syncType].description}
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem id={`sync-${syncType}`} value={syncType} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      )}
    </form.AppField>
  </FieldSet>
)
