import type { DatabaseType } from '@conar/shared/enums/database-type'
import { COLOR_OPTIONS, LABEL_OPTIONS } from '@conar/shared/constants'
import { Button } from '@conar/ui/components/button'
import { ButtonGroup } from '@conar/ui/components/button-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@conar/ui/components/card'
import { Checkbox } from '@conar/ui/components/checkbox'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiLoopLeftLine } from '@remixicon/react'
import { useId } from 'react'
import { ConnectionDetails } from '~/components/connection-details'

export function StepSave({ type, name, connectionString, setName, onRandomName, saveInCloud, setSaveInCloud, label, setLabel, color, setColor }: {
  type: DatabaseType
  name: string
  connectionString: string
  setName: (name: string) => void
  onRandomName: () => void
  saveInCloud: boolean
  setSaveInCloud: (saveInCloud: boolean) => void
  label: string | null
  setLabel: (label: string | null) => void
  color: string | null
  setColor: (color: string | null) => void
}) {
  const nameId = useId()
  const labelId = useId()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Save connection</CardTitle>
        <CardDescription>Save the connection to your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <ConnectionDetails className="mb-6" type={type} connectionString={connectionString} />
        <div className="flex flex-col gap-6">
          <div>
            <Label htmlFor={nameId} className="mb-2">
              Name
            </Label>
            <div className="flex w-full items-end gap-2">
              <Input
                id={nameId}
                className="field-sizing-content"
                placeholder="My connection"
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={onRandomName}
                    >
                      <RiLoopLeftLine />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={8}>
                    Generate a random connection name
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div>
            <Label htmlFor={labelId} className="mb-2">
              Label
              {' '}
              <span className="text-xs text-muted-foreground/50">(optional)</span>
            </Label>
            <div className="flex flex-col gap-2">
              <Input
                id={labelId}
                placeholder="Development, Production, Staging, etc."
                value={label ?? ''}
                onChange={e => setLabel(e.target.value)}
              />
              <ButtonGroup>
                {LABEL_OPTIONS.map(option => (
                  <Button
                    key={option}
                    variant={label === option ? 'default' : 'outline'}
                    size="xs"
                    onClick={() => setLabel(option)}
                    className="border!"
                  >
                    {option}
                  </Button>
                ))}
              </ButtonGroup>
            </div>
          </div>

          <div>
            <Label className="mb-2">
              Color
              {' '}
              <span className="text-xs text-muted-foreground/50">(optional)</span>
            </Label>
            <div className="flex flex-col gap-2">
              <div className="mt-1 flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(colorOption => (
                  <button
                    key={colorOption}
                    type="button"
                    className={cn(
                      `
                        size-6 cursor-pointer rounded-full bg-(--color)
                        transition-all
                      `,
                      color === colorOption && `
                        ring-2 ring-(--color) ring-offset-2
                        ring-offset-background
                      `,
                    )}
                    style={{
                      '--color': colorOption,
                    }}
                    onClick={() => setColor(color === colorOption ? null : colorOption)}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={saveInCloud}
                onCheckedChange={() => setSaveInCloud(!saveInCloud)}
              />
              Do you want to sync the password in our cloud?
            </label>
            <div className="text-xs text-balance text-muted-foreground/50">
              Syncing passwords in our cloud allows access from any device without re-entering the password.
              <br />
              If not synced, we will store the connection string without the password.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
