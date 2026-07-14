import { connectionLabels, ConnectionType } from '@tamery/shared/enums/connection-type'
import { Button } from '@tamery/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tamery/ui/components/card'

import { ConnectionIcon } from '~/entities/connection/components'
import { MongoIcon } from '~/icons/mongo'

export function StepType({
  type,
  setType,
}: {
  type: ConnectionType | null
  setType: (type: ConnectionType) => void
}) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Type of connection</CardTitle>
        <CardDescription>Choose the type of connection you want to create.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {Object.values(ConnectionType).map(connectionType => (
            <Button
              key={connectionType}
              variant={type === connectionType ? 'default' : 'outline'}
              onClick={() => setType(connectionType)}
              className="flex items-center gap-2 px-4 py-2"
            >
              <ConnectionIcon type={connectionType} className="size-4 shrink-0 text-primary" />
              {connectionLabels[connectionType]}
            </Button>
          ))}
          <Button
            variant="outline"
            disabled
            className="flex items-center gap-2 px-4 py-2 opacity-60"
          >
            <MongoIcon />
            MongoDB (soon)
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
