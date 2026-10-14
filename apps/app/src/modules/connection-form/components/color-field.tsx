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
              <span className="ring-foreground/25 size-full rounded-full ring-1 ring-inset" />
            </SwatchGroupItem>
            {COLOR_OPTIONS.map((option) => (
              <SwatchGroupItem
                key={option}
                value={option}
                aria-label={`Color ${option}`}
                style={{ '--swatch': option } as CSSProperties}
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
