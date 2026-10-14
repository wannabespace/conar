import { DiceFaces03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { suggestConnectionName } from '@tamery/connection/guess/name'
import { Button } from '@tamery/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useStore } from '@tanstack/react-form'

import { posthog } from '~/lib/posthog'
import { generateRandomName } from '~/utils/faker'

import type { ConnectionForm } from '../lib/connection-form'

export const NameField = ({ form }: { form: ConnectionForm }) => {
  const suggestion = useStore(form.store, ({ values }) =>
    suggestConnectionName(values)
  )

  return (
    <form.AppField name="name">
      {(field) => (
        <field.Field orientation="row">
          <field.Label>Name</field.Label>
          <field.Input
            variant="inset"
            data-mask
            autoComplete="off"
            placeholder={suggestion ?? 'Connection name'}
          >
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost-row"
                    size="icon-sm"
                    aria-label="Random name"
                    onClick={() => {
                      posthog.capture('connection_name_generated')
                      field.handleChange(generateRandomName())
                    }}
                  />
                }
              >
                <HugeiconsIcon icon={DiceFaces03Icon} strokeWidth={2} />
              </TooltipTrigger>
              <TooltipContent>Random name</TooltipContent>
            </Tooltip>
          </field.Input>
        </field.Field>
      )}
    </form.AppField>
  )
}
