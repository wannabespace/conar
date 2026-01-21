import { connectionLabels, ConnectionType } from '@conar/shared/enums/connection-type'
import { Button } from '@conar/ui/components/button'
import { ConnectionIcon } from '~/entities/connection/components'
import { MongoIcon } from '~/icons/mongo'

interface StepTypeProps {
  type: ConnectionType | null
  setType: (type: ConnectionType) => void
}
export function StepType({ type, setType }: StepTypeProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.values(ConnectionType).map(connectionType => (
        <Button
          key={connectionType}
          variant={type === connectionType ? 'default' : 'outline'}
          onClick={() => setType(connectionType)}
          className="flex items-center gap-2 px-4 py-2"
        >
          <ConnectionIcon
            type={connectionType}
            className="size-4 shrink-0 text-primary"
          />
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
  )
}
