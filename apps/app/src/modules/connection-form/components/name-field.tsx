import { DiceFaces03Icon } from '@hugeicons/core-free-icons'
import { IconButton } from '@tamery/ui/components/custom/icon-button'

import { posthog } from '~/lib/posthog'
import { generateRandomName } from '~/utils/faker'

import type { ConnectionForm } from '../lib/connection-form'

export const NameField = ({ form }: { form: ConnectionForm }) => (
  <form.AppField name="name">
    {(field) => (
      <field.Field orientation="row">
        <field.Label>Name</field.Label>
        <field.Input
          variant="inset"
          data-mask
          autoComplete="off"
          placeholder="Connection name"
        >
          <IconButton
            variant="ghost-faint"
            size="icon-sm"
            icon={DiceFaces03Icon}
            label="Random name"
            onClick={() => {
              posthog.capture('connection_name_generated')
              field.handleChange(generateRandomName())
            }}
          />
        </field.Input>
      </field.Field>
    )}
  </form.AppField>
)
