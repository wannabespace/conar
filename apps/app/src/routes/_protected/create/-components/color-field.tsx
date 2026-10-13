import { COLOR_OPTIONS } from '@tamery/shared/constants'
import { Field, FieldLabel } from '@tamery/ui/components/field'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@tamery/ui/components/toggle-group'
import type { CSSProperties } from 'react'

import type { ConnectionForm } from '../-lib/connection-form'

const NO_COLOR = 'none'

export const ColorField = ({ form }: { form: ConnectionForm }) => (
  <form.Subscribe selector={(state) => state.values.color}>
    {(color) => (
      <Field orientation="row">
        <FieldLabel htmlFor="color">Color</FieldLabel>
        <div className="px-2.5">
          <ToggleGroup
            id="color"
            aria-label="Color"
            value={[color ?? NO_COLOR]}
            onValueChange={([next]) =>
              next !== undefined &&
              form.setFieldValue('color', next === NO_COLOR ? null : next)
            }
          >
            <ToggleGroupItem value={NO_COLOR} aria-label="No color">
              <span className="ring-foreground/25 size-full rounded-full ring-1 ring-inset" />
            </ToggleGroupItem>
            {COLOR_OPTIONS.map((option) => (
              <ToggleGroupItem
                key={option}
                value={option}
                aria-label={`Color ${option}`}
                style={{ '--swatch': option } as CSSProperties}
              >
                <span className="size-full rounded-full bg-(--swatch)" />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </Field>
    )}
  </form.Subscribe>
)
