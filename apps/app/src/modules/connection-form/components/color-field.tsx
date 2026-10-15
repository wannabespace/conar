import { UnavailableIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { COLOR_OPTIONS } from '@tamery/shared/constants'
import {
  SwatchGroup,
  SwatchGroupItem,
} from '@tamery/ui/components/swatch-group'
import type { CSSProperties } from 'react'

import type { ConnectionForm } from '../lib/connection-form'

const NO_COLOR = 'none'

export const ColorField = ({ form }: { form: ConnectionForm }) => (
  <form.AppField name="color">
    {(field) => (
      <field.Field orientation="row">
        <field.Label>Color</field.Label>
        <div className="px-2.5">
          <SwatchGroup
            id={field.name}
            aria-label="Color"
            value={[field.state.value ?? NO_COLOR]}
            onValueChange={([next]) =>
              next !== undefined &&
              field.handleChange(next === NO_COLOR ? null : next)
            }
          >
            <SwatchGroupItem value={NO_COLOR} aria-label="No color">
              <HugeiconsIcon
                icon={UnavailableIcon}
                className="text-muted-foreground size-6 shrink-0"
              />
            </SwatchGroupItem>
            {COLOR_OPTIONS.map(({ label, value }) => (
              <SwatchGroupItem
                key={value}
                value={value}
                aria-label={label}
                style={{ '--swatch': value } as CSSProperties}
              >
                <span className="size-full rounded-full bg-(--swatch)" />
              </SwatchGroupItem>
            ))}
          </SwatchGroup>
        </div>
      </field.Field>
    )}
  </form.AppField>
)
