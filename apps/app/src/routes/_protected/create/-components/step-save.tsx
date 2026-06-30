import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { RiLoopLeftLine } from '@remixicon/react'
import { COLOR_OPTIONS, LABEL_OPTIONS } from '@tamery/shared/constants'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { Button } from '@tamery/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tamery/ui/components/card'
import { Checkbox } from '@tamery/ui/components/checkbox'
import { Group } from '@tamery/ui/components/group'
import { Input } from '@tamery/ui/components/input'
import { Label } from '@tamery/ui/components/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useLiveQuery } from '@tanstack/react-db'
import { useId } from 'react'
import { ConnectionDetails } from '~/components/connection-details'
import { useCollections } from '~/entities/collections'

export function StepSave({ type, name, connectionString, setName, onRandomName, syncType, setSyncType, label, setLabel, color, setColor }: {
  type: ConnectionType
  name: string
  connectionString: string
  setName: (name: string) => void
  onRandomName: () => void
  syncType: SyncType
  setSyncType: (syncType: SyncType) => void
  label: string | null
  setLabel: (label: string | null) => void
  color: string | null
  setColor: (color: string | null) => void
}) {
  const { connectionsCollection } = useCollections()
  const { data: connections } = useLiveQuery(q => q.from({ connections: connectionsCollection }).orderBy(({ connections }) => connections.createdAt, 'desc'), [connectionsCollection])
  const existingLabels = connections.map(connection => connection.label).filter((label): label is string => label !== null)
  const labels = [...new Set([...LABEL_OPTIONS, ...existingLabels])].toSorted()
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
              <Tooltip>
                <TooltipTrigger render={(
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onRandomName}
                  />
                )}
                >
                  <RiLoopLeftLine />
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>
                  Generate a random connection name
                </TooltipContent>
              </Tooltip>
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
              <Group>
                {labels.map(option => (
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
              </Group>
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
            <Label className="flex items-center gap-2 text-sm font-normal">
              <Checkbox
                checked={syncType === SyncType.Cloud}
                onCheckedChange={() => setSyncType(syncType === SyncType.Cloud ? SyncType.CloudWithoutPassword : SyncType.Cloud)}
              />
              Do you want to sync the password in our cloud?
            </Label>
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
