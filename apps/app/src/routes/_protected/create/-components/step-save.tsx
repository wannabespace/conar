import { Refresh01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { COLOR_OPTIONS, LABEL_OPTIONS } from '@tamery/shared/constants'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { Button } from '@tamery/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tamery/ui/components/card'
import { Group } from '@tamery/ui/components/group'
import { Input } from '@tamery/ui/components/input'
import { Label } from '@tamery/ui/components/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { eq, useLiveQuery } from '@tanstack/react-db'
import type { CSSProperties } from 'react'
import { useId } from 'react'

import { ConnectionDetails } from '~/components/connection-details'
import { useCollections } from '~/core/collections'
import { usePermissions } from '~/core/user/permissions'
import { useActiveWorkspace } from '~/core/workspace/hooks'
import { requestUpgrade } from '~/store'

const SYNC_OPTIONS = [
  {
    description:
      'The full connection string, including the password, is encrypted and synced to every device.',
    label: 'With password',
    value: SyncType.Cloud,
  },
  {
    description:
      'The connection string is synced without the password. Enter the password on each device.',
    label: 'Without password',
    value: SyncType.CloudWithoutPassword,
  },
  {
    description:
      'Only the name, label and color are synced. The connection string stays on this device.',
    label: 'Without connection string',
    value: SyncType.CloudWithoutConnectionString,
  },
]

export const StepSave = ({
  type,
  name,
  connectionString,
  setName,
  onRandomName,
  syncType,
  setSyncType,
  label,
  setLabel,
  color,
  setColor,
}: {
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
}) => {
  const canSyncString = usePermissions().check('connection.syncString')
  const isSyncDisabled = (value: SyncType) =>
    !canSyncString && value !== SyncType.CloudWithoutConnectionString
  const { connectionsCollection } = useCollections()
  const { data: activeWorkspace } = useActiveWorkspace()
  const { data: connections } = useLiveQuery({
    query: (q) => {
      const query = activeWorkspace
        ? q
            .from({ connections: connectionsCollection })
            .where(({ connections: connectionRows }) =>
              eq(connectionRows.workspaceId, activeWorkspace.id)
            )
        : q.from({ connections: connectionsCollection })

      return query.orderBy(
        ({ connections: connectionRows }) => connectionRows.createdAt,
        'desc'
      )
    },
  })
  const existingLabels = connections
    .map((connection) => connection.label)
    .filter((existingLabel): existingLabel is string => existingLabel !== null)
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
        <ConnectionDetails
          className="mb-6"
          type={type}
          connectionString={connectionString}
        />
        <div className="flex flex-col gap-6">
          <div>
            <Label htmlFor={nameId} className="mb-2">
              Name
            </Label>
            <div className="flex w-full items-end gap-2">
              <Input
                id={nameId}
                data-mask
                className="field-sizing-content"
                placeholder="My connection"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={onRandomName}
                    />
                  }
                >
                  <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} />
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>
                  Generate a random connection name
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div>
            <Label htmlFor={labelId} className="mb-2">
              Label{' '}
              <span className="text-muted-foreground/50 text-xs">
                (optional)
              </span>
            </Label>
            <div className="flex flex-col gap-2">
              <Input
                id={labelId}
                data-mask
                placeholder="Development, Production, Staging, etc."
                value={label ?? ''}
                onChange={(e) => setLabel(e.target.value)}
              />
              <Group>
                {labels.map((option) => (
                  <Button
                    key={option}
                    variant={label === option ? 'default' : 'outline'}
                    size="xs"
                    onClick={() => setLabel(option)}
                  >
                    {option}
                  </Button>
                ))}
              </Group>
            </div>
          </div>

          <div>
            <Label className="mb-2">
              Color{' '}
              <span className="text-muted-foreground/50 text-xs">
                (optional)
              </span>
            </Label>
            <div className="flex flex-col gap-2">
              <div className="mt-1 flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    aria-label={`Select ${colorOption} color`}
                    className={cn(
                      `size-6 rounded-full bg-(--color) transition-all`,
                      color === colorOption &&
                        `ring-offset-background ring-2 ring-(--color) ring-offset-2`
                    )}
                    style={
                      {
                        '--color': colorOption,
                      } as CSSProperties
                    }
                    onClick={() =>
                      setColor(color === colorOption ? null : colorOption)
                    }
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Sync</Label>
            <Group>
              {SYNC_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={syncType === option.value ? 'default' : 'outline'}
                  size="xs"
                  className={
                    isSyncDisabled(option.value) ? 'opacity-50' : undefined
                  }
                  onClick={() =>
                    isSyncDisabled(option.value)
                      ? requestUpgrade('sync')
                      : setSyncType(option.value)
                  }
                >
                  {option.label}
                </Button>
              ))}
            </Group>
            <div className="text-muted-foreground/50 text-xs text-balance">
              {
                SYNC_OPTIONS.find((option) => option.value === syncType)
                  ?.description
              }
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
